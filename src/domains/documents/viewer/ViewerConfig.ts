export const PDF_VIEWER_CONFIG = {
  virtualizationThresholdBytes: 25 * 1024 * 1024,
  virtualizationThresholdPages: 50,
  nativeViewerEnabled: true,
  mobileFallbackEnabled: true,
  preRenderBuffer: 2, // Prioritize current, next, next+1
  maxVisiblePages: 5,
};

export function getDeviceCapabilities() {
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // @ts-ignore
  const memory = typeof navigator !== 'undefined' ? navigator.deviceMemory || 4 : 4; // in GB
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  return { isMobile, memory, cores };
}
