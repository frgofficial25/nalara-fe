import { getStoredToken } from '@/services/auth';

/**
 * Utility helper to download a file reliably from a URL.
 * Supports Cloudinary URLs by leveraging the `fl_attachment` header transformation
 * to force direct browser attachment download without CORS or popup blocker issues.
 */
export async function downloadFile(url: string, fileName?: string): Promise<void> {
  if (!url) return;

  // 1. Standard same-origin or CORS fetch blob
  try {
    const headers: Record<string, string> = {};
    if (url.startsWith('/api-proxy/') || url.startsWith('/') || (typeof window !== 'undefined' && url.includes(window.location.host))) {
      const token = getStoredToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 10000);
  } catch (error) {
    console.warn('Direct blob fetch failed, falling back to direct anchor download:', error);
    
    let finalUrl = url;
    // 2. Cloudinary direct attachment download fallback
    if (finalUrl.includes('res.cloudinary.com')) {
      if (finalUrl.includes('/upload/') && !finalUrl.includes('fl_attachment')) {
        finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
      }
    } else if (finalUrl.startsWith('/api-proxy/') || finalUrl.startsWith('/')) {
      const token = getStoredToken();
      if (token) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}token=${encodeURIComponent(token)}`;
      }
    }

    const link = document.createElement('a');
    link.href = finalUrl;
    link.target = '_self';
    if (fileName) link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Helper to open a file in a new browser tab for preview/reading (NOT download).
 * Opens direct file URL in a new tab (or Office Live for docx/ppt).
 * Removes any fl_attachment flags to allow native browser rendering.
 */
export async function openInNewTab(fileUrl: string, fileName?: string, fileFormat?: string): Promise<void> {
  if (!fileUrl) return;

  // Clean fl_attachment if present so Cloudinary doesn't force download
  let cleanUrl = fileUrl.replace('/upload/fl_attachment/', '/upload/');
  
  const pathOnly = cleanUrl.split('?')[0].split('#')[0].toLowerCase();
  const urlExt = pathOnly.match(/\.([a-z0-9]+)$/i)?.[1] || '';
  const ext = (urlExt || fileFormat || '').trim().toLowerCase();

  const isDoc = ['docx', 'doc', 'ppt', 'pptx'].includes(ext) || (fileName && /\.(docx|doc|ppt|pptx)$/i.test(fileName));

  if (isDoc) {
    const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(cleanUrl)}`;
    window.open(officeUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // If the url is a proxy or same-host resource that requires auth, fetch it as a blob first using authorization header
  if (cleanUrl.startsWith('/api-proxy/') || cleanUrl.startsWith('/') || (typeof window !== 'undefined' && cleanUrl.includes(window.location.host))) {
    try {
      const headers: Record<string, string> = {};
      const token = getStoredToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(cleanUrl, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      let contentType = response.headers.get('content-type') || '';
      if (!contentType) {
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else contentType = 'application/octet-stream';
      }
      const fileBlob = new Blob([blob], { type: contentType });
      const blobUrl = window.URL.createObjectURL(fileBlob);

      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
      return;
    } catch (e) {
      console.warn('Failed to open proxy URL as blob, falling back to direct open:', e);
    }
  }

  // Direct open in new tab (PDFs, images, videos render natively in browser tabs)
  window.open(cleanUrl, '_blank', 'noopener,noreferrer');
}
