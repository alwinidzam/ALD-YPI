import { ViewerRenderContext, ViewerStrategy } from './ViewerStrategy';
import { parseGoogleDriveLink } from '../../../driveLink';

export class DriveLinkViewerStrategy implements ViewerStrategy {
  public readonly type = 'NATIVE';
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;

  async render(context: ViewerRenderContext): Promise<void> {
    this.container = context.containerElement;
    this.container.innerHTML = '';
    
    try {
      let previewUrl = context.document.driveUrl;
      if (context.document.driveFileId) {
        previewUrl = `https://drive.google.com/file/d/${context.document.driveFileId}/preview`;
      } else if (context.document.driveUrl) {
        const parsed = parseGoogleDriveLink(context.document.driveUrl);
        previewUrl = parsed?.previewUrl || context.document.driveUrl;
      }
      
      if (!previewUrl) {
         throw new Error("Invalid Drive Link");
      }

      this.iframe = document.createElement('iframe');
      this.iframe.src = previewUrl;
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.title = context.document.fileName || 'Google Drive Document Preview';
      
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

  destroy(): void {
    if (this.iframe) {
      this.iframe.src = 'about:blank';
      this.iframe = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}
