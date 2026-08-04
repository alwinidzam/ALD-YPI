# Known Limitations

While ALD v1.0.0 is robust and production-ready, there are a few architectural and technical limitations to be aware of:

## 1. Browser Compatibility
- **Service Workers:** Offline capabilities require a browser that supports Service Workers (Chrome, Safari, Edge, Firefox). Private/Incognito modes often disable Service Workers, which will prevent offline functionality and PWA installation.
- **Camera API:** Advanced camera controls (like Torch/Flashlight toggle) are dependent on the `ImageCapture` API, which may not be fully supported on all iOS Safari versions.

## 2. File Size Restrictions
- Documents are currently limited by Firebase Storage and Firestore document size constraints. Extremely large PDF files (over 50MB) may experience slower load times on low-end mobile devices due to rendering overhead.

## 3. Storage Persistence
- The browser may clear IndexedDB (where offline data is stored) if the device runs extremely low on disk space. It is recommended that users do not rely solely on the offline cache for long-term archiving without an eventual network sync.

## 4. Background Synchronization
- True background sync (uploading when the app is completely closed) relies on the browser's Background Sync API. iOS Safari has limited support for this, meaning uploads queued offline on iOS will require the user to reopen the app when the network is restored.

## 5. Camera Framerate
- Scanning on very old devices may experience lower framerates due to the computational overhead of the ZXing barcode detection algorithms running in the main JavaScript thread.
