# ADR 0003: PDF Viewer Strategy Pattern & Memory Optimization

* **Status:** Accepted
* **Date:** 2026-07-29
* **Context:** Designing the client-side document viewing subsystem to support diverse file sources, sizes, and client device constraints.

## Context & Problem Statement
Document viewing in ALD spans multiple file types and formats:
* Small PDFs (<5MB) on desktop browsers with native PDF rendering.
* Large PDFs (>20MB) on low-spec mobile tablets/phones.
* External Google Drive shared links.
* Legacy base64 document chunks.

A single rendering strategy caused browser tab crashes on low-end mobile devices due to PDF DOM explosion and memory over-allocation.

## Decision Drivers
* Zero browser crashes on low-memory mobile devices.
* Fast preview times for Google Drive embedded links.
* High fidelity for desktop viewers.

## Decision Outcome
Chosen **Strategy Pattern (`ViewerStrategyFactory`)**.
The system dynamically selects one of five rendering strategies based on device capabilities and document metadata:
1. `DriveLinkViewerStrategy`: Embedded iframe for Google Drive links.
2. `NativeViewerStrategy`: Native browser PDF viewer for desktop devices.
3. `VirtualizedPdfJsStrategy`: Chunked/virtualized canvas rendering for large files on mobile devices.
4. `StreamingPdfJsStrategy`: Progressive PDF.js canvas rendering for standard files.
5. `LegacyChunkStrategy`: Base64 data URI iframe fallback.

## Consequences
* **Positive:** Complete isolation of rendering logic, seamless fallback on low-end devices, 0 memory leaks verified via DOM cleanup hooks.
* **Negative:** Slightly higher code surface area for viewer tests.
