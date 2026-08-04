/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses a Google Drive "share" link and extracts the file ID, so the app can
 * build an embeddable preview URL without ever downloading the file itself.
 * Supports the two link shapes Drive actually generates:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://docs.google.com/document/d/FILE_ID/edit
 */

export interface ParsedDriveLink {
  fileId: string;
  previewUrl: string; // embeddable in an <iframe>
}

export function parseGoogleDriveLink(rawUrl: string): ParsedDriveLink | null {
  const url = rawUrl.trim();
  if (!url) return null;

  let host: URL;
  try {
    host = new URL(url);
  } catch {
    return null;
  }

  const isGoogleHost = /(^|\.)drive\.google\.com$/.test(host.hostname) || /(^|\.)docs\.google\.com$/.test(host.hostname);
  if (!isGoogleHost) return null;

  // Pattern 1: /file/d/FILE_ID/... or /document|spreadsheets|presentation/d/FILE_ID/...
  const pathMatch = host.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch) {
    const fileId = pathMatch[1];
    return { fileId, previewUrl: `https://drive.google.com/file/d/${fileId}/preview` };
  }

  // Pattern 2: ?id=FILE_ID (open?id=... or uc?id=...)
  const idParam = host.searchParams.get('id');
  if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) {
    return { fileId: idParam, previewUrl: `https://drive.google.com/file/d/${idParam}/preview` };
  }

  return null;
}
