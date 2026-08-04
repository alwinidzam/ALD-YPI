import { ViewerRenderContext, ViewerStrategy } from './ViewerStrategy';
import { DocumentStorageService } from '../storage/DocumentStorageService';
import { loadPdfJs } from './pdfjs-loader';

export class StreamingPdfJsStrategy implements ViewerStrategy {
  public readonly type = 'PDFJS_STREAM';
  
  private container: HTMLElement | null = null;
  private scrollContainer: HTMLElement | null = null;
  private pdfDocument: any = null;
  private canvasRefs: Map<number, HTMLCanvasElement> = new Map();
  private pageRefs: Map<number, HTMLElement> = new Map();
  private zoom: number = 1.0;
  private renderTasks: Set<any> = new Set();

  constructor(private storageService: DocumentStorageService) {}

  async render(context: ViewerRenderContext): Promise<void> {
    this.container = context.containerElement;
    this.container.innerHTML = '';
    
    // Create scroll container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-white/10 p-4 md:p-8 flex flex-col items-center gap-6';
    
    // Add scroll listener for page detection
    this.scrollContainer.addEventListener('scroll', () => {
      this.detectCurrentPage(context);
    });

    this.container.appendChild(this.scrollContainer);

    try {
      const url = await this.storageService.getDocumentUrl(context.document);
      if (!url) throw new Error('Could not resolve document URL.');

      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument({ url });
      
      // Update progress
      loadingTask.onProgress = (progressData: { loaded: number, total: number }) => {
        if (progressData.total > 0) {
          context.onLoadProgress((progressData.loaded / progressData.total) * 100);
        }
      };

      this.pdfDocument = await loadingTask.promise;
      const numPages = this.pdfDocument.numPages;
      context.onNumPagesLoaded(numPages);

      // Setup DOM for pages
      for (let i = 1; i <= numPages; i++) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'soft-bg rounded-sm relative shrink-0 shadow-lg';
        pageDiv.style.minHeight = '200px';
        pageDiv.style.minWidth = '200px';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'block';
        
        const pageNumberOverlay = document.createElement('div');
        pageNumberOverlay.className = 'absolute -bottom-5 left-0 right-0 text-center text-[10px] text-white/25 font-mono select-none';
        pageNumberOverlay.textContent = `${i} / ${numPages}`;
        
        pageDiv.appendChild(canvas);
        pageDiv.appendChild(pageNumberOverlay);
        this.scrollContainer.appendChild(pageDiv);
        
        this.pageRefs.set(i, pageDiv);
        this.canvasRefs.set(i, canvas);
      }

      // Initial render (render all pages progressively or based on viewport. For StreamingPdfJsStrategy, we can render all progressively)
      // We will render first page immediately to hit TTI goals, then progressively the rest.
      
      if (numPages > 0) {
        await this.renderPage(1);
        context.onPageChange(1);
        
        // Progressively render rest
        for (let i = 2; i <= numPages; i++) {
          this.renderPage(i); // Fire and forget
        }
      }

    } catch (err: any) {
      context.onError(err);
    }
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
    if (!this.pdfDocument) return;
    
    const page = await this.pdfDocument.getPage(pageNumber);
    const canvas = this.canvasRefs.get(pageNumber);
    if (!canvas) return;
    
    const viewport = page.getViewport({ scale: this.zoom });
    // Handle High DPI displays
    const outputScale = window.devicePixelRatio || 1;
    
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height =  Math.floor(viewport.height) + "px";

    const transform = outputScale !== 1 
      ? [outputScale, 0, 0, outputScale, 0, 0] 
      : null;

    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      transform: transform,
      viewport: viewport
    };

    const renderTask = page.render(renderContext);
    this.renderTasks.add(renderTask);
    
    try {
      await renderTask.promise;
    } catch (err: any) {
      if (err.name === 'RenderingCancelledException') {
        // Expected when destroyed
      } else {
        console.warn('Render error', err);
      }
    } finally {
      this.renderTasks.delete(renderTask);
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
    
    // Re-render all canvases. In virtualized we would only render visible ones.
    this.canvasRefs.forEach((_, pageNum) => {
      this.renderPage(pageNum);
    });
  }

  public destroy(): void {
    // Cancel all running render tasks
    for (const task of this.renderTasks) {
      task.cancel();
    }
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
