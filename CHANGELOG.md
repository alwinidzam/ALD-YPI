# Changelog

All notable changes to the ALD platform will be documented in this file.

## [1.0.0] - 2026-08-01

### Added
- Complete Progressive Web App (PWA) configuration with service worker and web manifest.
- Offline-first capabilities for Firestore and upload queues.
- Integrated ZXing library for robust QR and barcode scanning with torch support.
- Centralized `PdfViewer` with smooth entrance animations and memory optimizations.
- `pdfAccountGenerator` for batch printing of staff QR cards.
- Background sync status bar for monitoring pending offline uploads.
- Full staff management dashboard with CRUD operations and soft delete capabilities.
- Live active clock and real-time dashboard analytics.
- Document Scanner Modal with cropping guidelines and multi-page support.

### Changed
- Migrated legacy barcode scanner to `@zxing/library` for vastly improved scan rates.
- Enforced strict touch-target accessibility sizing across all buttons and inputs.
- Enhanced transition animations across routes using `framer-motion`.
- Adjusted Vite build configurations for optimized vendor chunk splitting.

### Fixed
- Addressed memory leak in PDF viewer during rapid document switching.
- Fixed asynchronous import issues during PDF generation with `jsPDF`.
- Fixed Firestore date-time synchronization issues.
- Fixed offline cache pollution and implemented stale-while-revalidate for app shell.
- Resolved camera permission state recovery in Scanner Module.
