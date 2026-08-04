import { ViewerRenderContext, ViewerStrategy, ViewerStrategyMetrics } from './ViewerStrategy';
import { DocumentStorageService } from '../storage/DocumentStorageService';
import { loadPdfJs } from './pdfjs-loader';
import { PDF_VIEWER_CONFIG } from './ViewerConfig';

export class VirtualizedPdfJsStrategy implements ViewerStrategy {
  public readonly type = 'PDFJS_VIRTUAL';
  
  private container: HTMLElement | null = null;
  private scrollContainer: HTMLElement | null = null;
  private pdfDocument: any = null;
  private canvasRefs: Map<number, HTMLCanvasElement> = new Map();
  private pageRefs: Map<number, HTMLElement> = new Map();
  private zoom: number = 1.0;
  private renderTasks: Map<number, any> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private isDestroyed = false;
  
  // Track which pages are currently visible
  private visiblePages: Set<number> = new Set();
  
  // Dimensions for placeholder setup
  private defaultPageWidth = 600;
  private defaultPageHeight = 800;

  // Metrics
  private metrics: ViewerStrategyMetrics = {
    renderTimeMs: 0,
    pagesRendered: 0,
    pagesDestroyed: 0
  };
  private startTime = 0;

  constructor(private storageService: DocumentStorageService) {}

  public getMetrics(): ViewerStrategyMetrics {
    return {
      ...this.metrics,
      renderTimeMs: performance.now() - this.startTime
    };
  }

  async render(context: ViewerRenderContext): Promise<void> {
    this.startTime = performance.now();
    this.container = context.containerElement;
    this.container.innerHTML = '';
    
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-white/10 p-4 md:p-8 flex flex-col items-center gap-6';
    
    this.scrollContainer.addEventListener('scroll', () => {
      this.detectCurrentPage(context);
    });

    this.container.appendChild(this.scrollContainer);

    try {
      const url = await this.storageService.getDocumentUrl(context.document);
      if (!url) throw new Error('Could not resolve document URL.');

      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument({ url });
      
      loadingTask.onProgress = (progressData: { loaded: number, total: number }) => {
        if (progressData.total > 0 && !this.isDestroyed) {
          context.onLoadProgress((progressData.loaded / progressData.total) * 100);
        }
      };

      this.pdfDocument = await loadingTask.promise;
      if (this.isDestroyed) return;

      const numPages = this.pdfDocument.numPages;
      context.onNumPagesLoaded(numPages);

      // Estimate dimensions from page 1
      if (numPages > 0) {
        const page1 = await this.pdfDocument.getPage(1);
        const viewport = page1.getViewport({ scale: this.zoom });
        this.defaultPageWidth = viewport.width;
        this.defaultPageHeight = viewport.height;
      }

      this.setupIntersectionObserver();

      for (let i = 1; i <= numPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'soft-bg rounded-sm relative shrink-0 shadow-lg';
        pageDiv.style.width = `\${this.defaultPageWidth}px`;
        pageDiv.style.height = `\${this.defaultPageHeight}px`;
        pageDiv.dataset.pageNumber = i.toString();
        
        const canvas = document.createElement('canvas');
        canvas.className = 'block';
        
        const pageNumberOverlay = document.createElement('div');
        pageNumberOverlay.className = 'absolute -bottom-5 left-0 right-0 text-center text-[10px] text-white/25 font-mono select-none';
        pageNumberOverlay.textContent = `\${i} / \${numPages}`;
        
        pageDiv.appendChild(canvas);
        pageDiv.appendChild(pageNumberOverlay);
        this.scrollContainer.appendChild(pageDiv);
        
        this.pageRefs.set(i, pageDiv);
        this.canvasRefs.set(i, canvas);
        
        if (this.intersectionObserver) {
          this.intersectionObserver.observe(pageDiv);
        }
      }

    } catch (err: any) {
      if (!this.isDestroyed) context.onError(err);
    }
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const pageNum = parseInt((entry.target as HTMLElement).dataset.pageNumber || '1', 10);
        
        if (entry.isIntersecting) {
          this.visiblePages.add(pageNum);
          this.triggerProgressiveRender(pageNum);
        } else {
          this.visiblePages.delete(pageNum);
          // If a page is far out of view (e.g. not adjacent to a visible one), clear it
          this.cleanupUnusedPages();
        }
      });
    }, {
      root: this.scrollContainer,
      rootMargin: '100% 0px 100% 0px', // Pre-load 1 viewport above and below
      threshold: 0.01
    });
  }

  private triggerProgressiveRender(pageNum: number) {
    // Priority: current -> next -> next+1 -> previous
    this.renderPage(pageNum);
    for (let i = 1; i <= PDF_VIEWER_CONFIG.preRenderBuffer; i++) {
      this.renderPage(pageNum + i);
    }
    for (let i = 1; i <= PDF_VIEWER_CONFIG.preRenderBuffer; i++) {
      this.renderPage(pageNum - i);
    }
  }

  private cleanupUnusedPages() {
    // Keep pages that are in visiblePages or adjacent to them based on buffer
    const activePages = new Set<number>();
    this.visiblePages.forEach(p => {
      activePages.add(p);
      for (let i = 1; i <= PDF_VIEWER_CONFIG.preRenderBuffer; i++) {
        activePages.add(p + i);
        activePages.add(p - i);
      }
    });

    this.canvasRefs.forEach((canvas, pageNum) => {
      if (!activePages.has(pageNum)) {
        this.clearCanvas(pageNum);
      }
    });
  }

  private detectCurrentPage(context: ViewerRenderContext) {
    if (!this.scrollContainer) return;
    const containerTop = this.scrollContainer.getBoundingClientRect().top;
    const containerCenter = containerTop + this.scrollContainer.clientHeight / 2;

    let closestPage = 1;
    let minDistance = Infinity;

    this.pageRefs.forEach((el, pNum) => {
      const rect = el.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const dist = Math.abs(containerCenter - pageCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestPage = pNum;
      }
    });

    context.onPageChange(closestPage);
  }

  private async renderPage(pageNumber: number) {
    if (this.isDestroyed || !this.pdfDocument || pageNumber < 1 || pageNumber > this.pdfDocument.numPages) return;
    
    // Skip if already rendering or rendered
    if (this.renderTasks.has(pageNumber)) return;
    
    const canvas = this.canvasRefs.get(pageNumber);
    if (!canvas) return;
    
    // Check if it already has content (not width 0)
    if (canvas.width > 0 && canvas.height > 0) return;

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      if (this.isDestroyed) return;
      
      const viewport = page.getViewport({ scale: this.zoom });
      const outputScale = window.devicePixelRatio || 1;
      
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height =  Math.floor(viewport.height) + "px";

      const pageDiv = this.pageRefs.get(pageNumber);
      if (pageDiv) {
        pageDiv.style.width = `\${viewport.width}px`;
        pageDiv.style.height = `\${viewport.height}px`;
      }

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      const renderContext = { canvasContext: canvas.getContext('2d'), transform, viewport };
      
      const renderTask = page.render(renderContext);
      this.renderTasks.set(pageNumber, renderTask);
      
      await renderTask.promise;
      this.metrics.pagesRendered++;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn('Render error', err);
      }
    } finally {
      this.renderTasks.delete(pageNumber);
    }
  }

  private clearCanvas(pageNumber: number) {
    const task = this.renderTasks.get(pageNumber);
    if (task) {
      task.cancel();
      this.renderTasks.delete(pageNumber);
    }
    
    const canvas = this.canvasRefs.get(pageNumber);
    if (canvas && canvas.width > 0) {
      // Clear memory
      canvas.width = 0;
      canvas.height = 0;
      this.metrics.pagesDestroyed++;
    }
  }

  public goToPage(pageNumber: number): void {
    const el = this.pageRefs.get(pageNumber);
    if (el && this.scrollContainer) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public setZoom(zoomLevel: number): void {
    if (this.zoom === zoomLevel) return;
    this.zoom = zoomLevel;
    
    // Clear all and re-render visible
    this.canvasRefs.forEach((_, pageNum) => this.clearCanvas(pageNum));
    
    // Update default dimensions for placeholders based on new zoom
    if (this.pdfDocument) {
      this.pdfDocument.getPage(1).then((page: any) => {
        if (this.isDestroyed) return;
        const viewport = page.getViewport({ scale: this.zoom });
        this.defaultPageWidth = viewport.width;
        this.defaultPageHeight = viewport.height;
        
        // Re-apply to all page divs to maintain layout
        this.pageRefs.forEach(div => {
           div.style.width = `\${this.defaultPageWidth}px`;
           div.style.height = `\${this.defaultPageHeight}px`;
        });
        
        // Re-render visible pages
        this.visiblePages.forEach(p => {
          this.triggerProgressiveRender(p);
        });
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.renderTasks.forEach(task => task.cancel());
    this.renderTasks.clear();

    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    
    this.scrollContainer = null;
    this.pageRefs.clear();
    this.canvasRefs.clear();
  }
}
