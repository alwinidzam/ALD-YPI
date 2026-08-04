import { ViewerRenderContext, ViewerStrategy } from './ViewerStrategy';
import { DocumentStorageService } from '../storage/DocumentStorageService';

export class NativeViewerStrategy implements ViewerStrategy {
  public readonly type = 'NATIVE';
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;

  constructor(private storageService: DocumentStorageService) {}

  public async render(context: ViewerRenderContext): Promise<void> {
    this.container = context.containerElement;
    this.container.innerHTML = ''; // Clear container

    try {
      const url = await this.storageService.getDocumentUrl(context.document);
      
      if (!url) {
        throw new Error('Could not resolve document URL for native rendering.');
      }

      this.iframe = document.createElement('iframe');
      this.iframe.src = url;
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.title = context.document.fileName;

      // Add a simple load listener to simulate first-page fast load event
      this.iframe.onload = () => {
        context.onLoadProgress(100);
        context.onPageChange(1);
        context.onNumPagesLoaded(1);
      };

      this.container.appendChild(this.iframe);

    } catch (err: any) {
      context.onError(err);
    }
  }

  public destroy(): void {
    if (this.iframe) {
      this.iframe.src = 'about:blank'; // Free memory
      this.iframe = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}
