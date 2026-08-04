export const PDFJS_VERSION = '3.11.174';
export const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsModulePromise: Promise<any> | null = null;

export async function loadPdfJs(): Promise<any> {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import(/* @vite-ignore */ `${PDFJS_BASE}/pdf.min.mjs`)
      .then((mod) => {
        mod.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
        return mod;
      })
      .catch((err) => {
        pdfjsModulePromise = null;
        throw err;
      });
  }
  return pdfjsModulePromise;
}
