/**
 * Utility helper to download a file reliably from a URL.
 * Supports Cloudinary URLs by leveraging the `fl_attachment` header transformation
 * to force direct browser attachment download without CORS or popup blocker issues.
 */
export async function downloadFile(url: string, fileName?: string): Promise<void> {
  if (!url) return;

  // 1. Cloudinary direct attachment download
  if (url.includes('res.cloudinary.com')) {
    let cloudDownloadUrl = url;
    if (cloudDownloadUrl.includes('/upload/') && !cloudDownloadUrl.includes('fl_attachment')) {
      cloudDownloadUrl = cloudDownloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    
    const link = document.createElement('a');
    link.href = cloudDownloadUrl;
    if (fileName) link.download = fileName;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Standard same-origin or CORS fetch blob
  try {
    const response = await fetch(url);
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
    const link = document.createElement('a');
    link.href = url;
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
export function openInNewTab(fileUrl: string, fileName?: string, fileFormat?: string): void {
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

  // Direct open in new tab (PDFs, images, videos render natively in browser tabs)
  window.open(cleanUrl, '_blank', 'noopener,noreferrer');
}
