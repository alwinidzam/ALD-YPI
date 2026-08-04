import { DocumentMetadata } from '../../../types';

export interface ViewerRenderContext {
  containerElement: HTMLElement;
  document: DocumentMetadata;
  onLoadProgress: (progress: number) => void;
  onPageChange: (page: number) => void;
  onNumPagesLoaded: (numPages: number) => void;
  onError: (error: Error) => void;
}

export interface ViewerStrategyMetrics {
  renderTimeMs: number;
  memoryUsageBytes?: number;
  pagesRendered: number;
  pagesDestroyed: number;
  fallbackReason?: string;
}

export interface ViewerStrategy {
  /**
   * Identifies the strategy type
   */
  readonly type: 'NATIVE' | 'PDFJS_STREAM' | 'PDFJS_VIRTUAL' | 'LEGACY_CHUNK';

  /**
   * Initializes and renders the viewer inside the provided container
   */
  render(context: ViewerRenderContext): Promise<void>;

  /**
   * Cleans up resources when the viewer is unmounted
   */
  destroy(): void;

  /**
   * Navigate to a specific page
   */
  goToPage?(pageNumber: number): void;

  /**
   * Set zoom level
   */
  setZoom?(zoomLevel: number): void;

  /**
   * Get runtime performance metrics
   */
  getMetrics?(): ViewerStrategyMetrics;
}
