# ALD PDF Subsystem Technical Design

## 1. Overall Architecture
### Component Diagram

```text
[ User Interaction: Upload / View / Download ]
               |
               v
      +-------------------+
      | Application Layer | (React Components, Modals)
      +-------------------+
               |
               v
  +--------------------------+
  | DocumentStorageService   | (Orchestrator for Storage & Migration)
  +--------------------------+
               |
      +--------+--------+
      |                 |
      v                 v
+----------------+ +------------------+
| StorageProvider| | Firestore        | (Metadata & Legacy Chunks)
+----------------+ +------------------+
      |                 |
      v                 v
+----------------+ +------------------+
| Firebase       | | ViewerStrategy   | 
| Storage (v2)   | | Factory          |
+----------------+ +------------------+
                        |
            +-----------+-----------+
            |           |           |
            v           v           v
    +----------+ +-----------+ +------------+
    | Native   | | Streaming | | Legacy     |
    | Viewer   | | PDF.js    | | Chunk      |
    +----------+ +-----------+ +------------+
```

### Layer Responsibilities & Data Flow
*   **Presentation Layer**: `PdfViewer` component manages UI controls (zoom, pagination) and delegates rendering to a Strategy.
*   **Service Layer**: `DocumentStorageService` manages the domain logic for uploading, migrating, and fetching URLs.
*   **Infrastructure Layer**: `FirebaseStorageProvider` handles the actual bits sent to Google Cloud Storage.

## 2. Class Design

*   **StorageProvider** (Interface): Defines the contract for cloud binary storage operations (`uploadDocument`, `getDownloadUrl`, `deleteDocument`). Decouples the application from a specific vendor.
*   **FirebaseStorageProvider** (Implementation): Implements `StorageProvider` using Firebase Storage SDK. Handles multipart uploads, metadata attachment (MIME type, checksums), and URL resolution.
*   **DocumentStorageService**: Orchestrates the storage lifecycle. Computes SHA-256 checksums, updates Firestore metadata to reflect `migrationState` and `integrity`, performs incremental legacy document migrations, and coordinates deletions across Storage and Firestore.
*   **ViewerStrategyFactory**: Encapsulates the decision-making logic for selecting the best PDF viewer implementation. Evaluates document metadata (`migrationState`), browser capabilities (`navigator.pdfViewerEnabled`), and device type (mobile vs. desktop).
*   **NativeViewerStrategy**: Renders PDF natively via an `iframe`. Preferred for desktop browsers with built-in PDF support. Yields the fastest Time to Interactive (TTI) and lowest memory footprint.
*   **StreamingPdfJsStrategy**: Utilizes PDF.js with HTTP Range Requests for progressive rendering. Preferred for mobile browsers or unsupported desktop environments. Renders pages strictly on-demand.
*   **VirtualizedPdfJsStrategy**: An extension of the streaming strategy specifically designed for massive documents (e.g., >50 pages or >25MB). Implements aggressive viewport virtualisation and canvas recycling to cap memory usage.
*   **LegacyChunkStrategy**: Fallback viewer for documents that have not yet been migrated to Firebase Storage. Reconstructs Base64 strings from Firestore chunks and renders them using legacy mechanisms, optionally triggering background migration.

## 3. Sequence Diagrams

### 3.1. Upload New PDF
```text
Client -> DocumentStorageService: uploadDocument(file, metadata)
DocumentStorageService -> DocumentStorageService: computeChecksum(file)
DocumentStorageService -> FirebaseStorageProvider: uploadDocument(file, path, integrity)
FirebaseStorageProvider -> Firebase Storage: uploadBytes()
DocumentStorageService -> Firestore: updateDoc(metadata + storagePath)
DocumentStorageService -> Client: success
```

### 3.2. Open Modern PDF
```text
Client -> ViewerStrategyFactory: determineStrategy(document)
ViewerStrategyFactory -> Client: NativeViewerStrategy
Client -> NativeViewerStrategy: render(context)
NativeViewerStrategy -> DocumentStorageService: getDocumentUrl()
DocumentStorageService -> FirebaseStorageProvider: getDownloadUrl(path)
NativeViewerStrategy -> DOM: mount <iframe> with URL
```

### 3.3. Open Legacy PDF & Background Migration
```text
Client -> ViewerStrategyFactory: determineStrategy(document)
ViewerStrategyFactory -> Client: LegacyChunkStrategy
Client -> LegacyChunkStrategy: render(context)
LegacyChunkStrategy -> Firestore: fetch documentChunks
LegacyChunkStrategy -> DOM: render Base64
LegacyChunkStrategy -> DocumentStorageService: triggerBackgroundMigration(document)
DocumentStorageService -> FirebaseStorageProvider: upload base64 blob
DocumentStorageService -> Firestore: update migrationState='STORAGE'
```

### 3.4. Download PDF
```text
Client -> DocumentStorageService: getDocumentUrl(metadata)
DocumentStorageService -> FirebaseStorageProvider: getDownloadUrl()
FirebaseStorageProvider -> Client: Signed URL
Client -> DOM: trigger <a> download with URL
```

## 4. State Diagrams

### Document Lifecycle
```text
[ NEW UPLOAD ] -> (STORAGE)
[ LEGACY DOCUMENT ] -> (LEGACY) -> [ Background Migration ] -> (MIGRATING) -> (STORAGE)
                                                                            \-> (FAILED) -> Retry
```

### Viewer Lifecycle
```text
[ INITIALIZING ] -> [ STRATEGY SELECTION ] -> [ RENDERING_FIRST_PAGE ] -> [ INTERACTIVE ] -> [ IDLE / LAZY_LOADING_PAGES ] -> [ DESTROYED ]
```

## 5. Decision Flow
How the application chooses Native Viewer, Streaming PDF.js, Virtualized Viewer, or Legacy Viewer:

```text
IF document.migrationState == 'STORAGE' THEN
    IF browser.pdfViewerEnabled == TRUE AND isMobile == FALSE THEN
        RETURN NativeViewerStrategy
    ELSE
        IF document.integrity.sizeBytes > 25MB OR estimatedPages > 50 THEN
            RETURN VirtualizedPdfJsStrategy
        ELSE
            RETURN StreamingPdfJsStrategy
        END IF
    END IF
ELSE IF document.migrationState == 'LEGACY' OR fileData exists THEN
    RETURN LegacyChunkStrategy (Triggers async migration)
ELSE
    RETURN ErrorStrategy
END IF
```

## 6. Performance Strategy
*   **Progressive Loading**: HTTP Range Requests must be functional for PDF.js to fetch metadata and the first page without downloading the entire file.
*   **Streaming**: Network fetching is decoupled from rendering. The browser streams bytes while PDF.js begins parsing the PDF dictionary.
*   **Virtualization**: In `VirtualizedPdfJsStrategy`, only the visible pages (+1 above and below) are kept in the DOM. 
*   **Memory Management**: Off-screen canvases are explicitly destroyed (`context.clearRect` and setting width/height to 0) to free JS heap and GPU memory.
*   **Cache Strategy**: Rely on browser caching and CDN edge caching (Firebase Storage).

## 7. Failure Recovery
*   **Network Interruption**: On download failure, user is presented with a retry button. On chunk loading failure, exponential backoff is triggered.
*   **Storage Unavailable**: Fallback to Legacy chunks if available. Otherwise, show a graceful error state.
*   **Corrupted File**: Checksum verification during migration. If checksum fails post-upload, migration state reverts to `FAILED`.
*   **Failed Migration**: If migration fails (e.g., user closes tab), `migrationState` becomes `FAILED` or remains `MIGRATING`. A background check on read can reset stuck `MIGRATING` states after a timeout, reverting them to `LEGACY` to be retried.

## 8. Security
*   **Firestore Rules**: Metadata documents retain the existing Role-Based Access Control (RBAC). Only authorized users can see the document record.
*   **Storage Rules**: Firebase Storage Security Rules mirror the Firestore logic. Paths are structured as `documents/{institution}/{documentId}`. 
*   **RBAC Enforcement**: The frontend does not construct download URLs locally; it requests them via the Storage SDK, which respects the rules.
*   **Download Authorization**: Uses Firebase Auth tokens implicitly passed with SDK requests. No signed URLs are leaked publicly.

## 9. Performance Targets
*   **First Page Visible**: < 2.0 seconds on standard 4G/LTE connections.
*   **Time to Interactive (TTI)**: < 3.0 seconds (user can scroll and zoom).
*   **Maximum Memory Usage**: Capped at ~150MB active JS heap overhead regardless of document length.
*   **Large Document Support**: Documents up to 100MB+ or 500+ pages should load instantly and scroll smoothly without tab crashes.

## 10. Risks and Trade-offs
*   **CORS Issues with Firebase Storage**: 
    *   *Risk*: PDF.js fails to fetch document bytes due to strict CORS. 
    *   *Mitigation*: Ensure Firebase Storage CORS rules are configured to allow `GET` requests from the application's domain with appropriate headers.
*   **Large Files Crashing Mobile Browsers**: 
    *   *Risk*: PDF.js allocates too many `<canvas>` elements for a 100-page document. 
    *   *Mitigation*: Strict implementation of `VirtualizedPdfJsStrategy`.
*   **Interrupted Migrations**: 
    *   *Risk*: User closes tab while background migration is occurring. 
    *   *Mitigation*: Source chunks are never deleted until successful commit.
*   **Trade-off: Complexity vs. Performance**:
    *   *Trade-off*: Maintaining 4 distinct viewer strategies increases code surface area. 
    *   *Justification*: A single strategy cannot provide a native-feeling experience on desktop while preventing OOM crashes on mobile for 100MB files.

## 11. Reference Implementation

This section provides canonical implementation references demonstrating the expected architecture, interfaces, design patterns, and component interactions. These are not production-ready implementations but architectural blueprints.

### StorageProvider
```typescript
export interface StorageProvider {
  uploadDocument(
    file: File | Blob, 
    path: string, 
    metadata: DocumentIntegrityMetadata
  ): Promise<string>;
  getDownloadUrl(path: string): Promise<string>;
  deleteDocument(path: string): Promise<void>;
}

export class FirebaseStorageProvider implements StorageProvider {
  async uploadDocument(file: File | Blob, path: string, metadata: DocumentIntegrityMetadata): Promise<string> {
    // Implementation using Firebase Storage SDK (ref, uploadBytes)
    return path;
  }
  async getDownloadUrl(path: string): Promise<string> {
    // Implementation using Firebase Storage SDK (getDownloadURL)
    return 'https://...'; 
  }
  async deleteDocument(path: string): Promise<void> {
    // Implementation using Firebase Storage SDK (deleteObject)
  }
}
```

### DocumentStorageService
```typescript
export class DocumentStorageService {
  constructor(private storageProvider: StorageProvider) {}

  async uploadDocument(documentId: string, institution: string, file: File | Blob) {
    // 1. Compute checksum & metadata
    // 2. Call storageProvider.uploadDocument
    // 3. Return path and integrity metadata
  }

  async migrateLegacyDocument(metadata: DocumentMetadata): Promise<DocumentMetadata> {
    // 1. Set state to MIGRATING
    // 2. Fetch Base64 from Firestore chunks
    // 3. Convert to Blob & upload via storageProvider
    // 4. Update Firestore state to STORAGE, clear fileData
    // 5. Handle failure & recovery
    return updatedMetadata;
  }
}
```

### ViewerStrategyFactory
```typescript
export class ViewerStrategyFactory {
  constructor(private storageService: DocumentStorageService) {}

  determineStrategy(document: DocumentMetadata): ViewerStrategy {
    if (document.migrationState !== 'STORAGE') {
      return new LegacyChunkStrategy(this.storageService);
    }
    
    if (NATIVE_PDF_SUPPORTED && !isMobile()) {
      return new NativeViewerStrategy(this.storageService);
    }
    
    if (document.integrity && document.integrity.sizeBytes > 25 * 1024 * 1024) {
      return new VirtualizedPdfJsStrategy(this.storageService);
    }
    
    return new StreamingPdfJsStrategy(this.storageService);
  }
}
```

### NativeViewerStrategy
```typescript
export class NativeViewerStrategy implements ViewerStrategy {
  public readonly type = 'NATIVE';
  private iframe: HTMLIFrameElement | null = null;

  constructor(private storageService: DocumentStorageService) {}

  async render(context: ViewerRenderContext): Promise<void> {
    const url = await this.storageService.getDocumentUrl(context.document);
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    context.containerElement.appendChild(this.iframe);
    
    this.iframe.onload = () => context.onLoadProgress(100);
  }

  destroy(): void {
    if (this.iframe) this.iframe.src = 'about:blank';
  }
}
```

### StreamingPdfJsStrategy
```typescript
export class StreamingPdfJsStrategy implements ViewerStrategy {
  public readonly type = 'PDFJS_STREAM';

  constructor(private storageService: DocumentStorageService) {}

  async render(context: ViewerRenderContext): Promise<void> {
    // 1. Get Download URL
    // 2. Initialize PDF.js worker
    // 3. Load document via PDF.js (utilizing Range requests implicitly)
    // 4. Render all pages sequentially or as scrolled into view
  }

  destroy(): void {
    // Cleanup PDF.js document and canvases
  }
}
```

### VirtualizedPdfJsStrategy
```typescript
export class VirtualizedPdfJsStrategy implements ViewerStrategy {
  public readonly type = 'PDFJS_VIRTUAL';

  constructor(private storageService: DocumentStorageService) {}

  async render(context: ViewerRenderContext): Promise<void> {
    // 1. Get Download URL
    // 2. Initialize PDF.js
    // 3. Setup IntersectionObserver on page containers
    // 4. Render only visible pages (+1 buffer)
    // 5. Destroy canvases for pages that scroll out of view
  }

  destroy(): void {
    // Cleanup IntersectionObserver, canvases, and PDF.js document
  }
}
```

### LegacyChunkStrategy
```typescript
export class LegacyChunkStrategy implements ViewerStrategy {
  public readonly type = 'LEGACY_CHUNK';

  constructor(private storageService: DocumentStorageService) {}

  async render(context: ViewerRenderContext): Promise<void> {
    // 1. Fetch chunks from Firestore
    // 2. Reconstruct Base64
    // 3. Render using an iframe with Data URI (or pass to PDF.js)
    // 4. Trigger background migration: this.storageService.migrateLegacyDocument(context.document)
  }

  destroy(): void {}
}
```

### MigrationService
```typescript
export class MigrationService {
  constructor(private storageService: DocumentStorageService) {}

  /**
   * Orchestrates the background migration of legacy documents to the new storage system.
   */
  async migrateDocument(metadata: DocumentMetadata): Promise<void> {
    try {
      // 1. Verify precondition (is document in LEGACY state?)
      if (metadata.migrationState && metadata.migrationState !== 'LEGACY') return;

      // 2. Trigger migration via DocumentStorageService
      await this.storageService.migrateLegacyDocument(metadata);
      
      // 3. Log success metrics
      console.info(`Migration successful for document ${metadata.id}`);
    } catch (error) {
      // 4. Handle failure, update state, schedule retry
      console.error(`Migration failed for document ${metadata.id}`, error);
    }
  }

  /**
   * Batch migrate all documents in LEGACY state.
   */
  async runBatchMigration(): Promise<void> {
    // Implement batch query and process documents incrementally
  }
}
```
