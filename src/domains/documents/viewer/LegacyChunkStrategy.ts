import { ViewerRenderContext, ViewerStrategy } from './ViewerStrategy';
import { DocumentStorageService } from '../storage/DocumentStorageService';
import { MigrationService } from '../storage/MigrationService';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DocumentMetadata } from '../../../types';

export class LegacyChunkStrategy implements ViewerStrategy {
  public readonly type = 'LEGACY_CHUNK';
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;

  constructor(
    private storageService: DocumentStorageService,
    private migrationService: MigrationService
  ) {}

  async render(context: ViewerRenderContext): Promise<void> {
    this.container = context.containerElement;
    this.container.innerHTML = '';
    
    try {
      context.onLoadProgress(10); // Start loading

      // 1. Fetch chunks (Simulating the old chunk assembly logic)
      const dataUri = await this.assembleLegacyChunks(context.document, context);
      
      if (!dataUri) {
         throw new Error('Gagal merakit data dari chunks');
      }

      // 2. Render using an iframe (similar to native, but using Data URI)
      // Note: Large Data URIs in iframe can crash Safari, but this is legacy fallback
      this.iframe = document.createElement('iframe');
      this.iframe.src = dataUri;
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.title = context.document.fileName;
      
      this.iframe.onload = () => {
        context.onLoadProgress(100);
        context.onPageChange(1);
        context.onNumPagesLoaded(1);
      };
      
      this.container.appendChild(this.iframe);

      // 3. Trigger background migration
      if (context.document.migrationState === 'LEGACY') {
         this.migrationService.migrateDocument(context.document).catch(e => {
            console.error("Background migration failed:", e);
         });
      }

    } catch (err: any) {
      context.onError(err);
    }
  }

  private async assembleLegacyChunks(documentMeta: DocumentMetadata, context: ViewerRenderContext): Promise<string | null> {
      // In old implementation, chunks were stored in dataChunks collection or inside document
      // We will try to fetch the Base64 chunks.
      // This is a simplified reconstruction based on legacy implementation.
      let base64 = "";
      
      if (documentMeta.fileData) {
          // If it's a small file and fileData is directly on metadata
          base64 = documentMeta.fileData;
      } else if (documentMeta.chunks) {
         for (let i = 0; i < documentMeta.chunks; i++) {
           const chunkDoc = await getDoc(doc(db, `documents/\${documentMeta.institution}/dataChunks/\${documentMeta.id}_chunk_\${i}`));
           if (chunkDoc.exists()) {
             base64 += chunkDoc.data().data;
           }
           // Update progress
           context.onLoadProgress(10 + (90 * (i + 1) / documentMeta.chunks));
         }
      }
      
      if (!base64) return null;
      return base64.startsWith('data:application/pdf;base64,') ? base64 : `data:application/pdf;base64,${base64}`;
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
