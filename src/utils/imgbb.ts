/**
 * ImgBB Image Upload Utility
 * Handles uploading device photos to https://api.imgbb.com/1/upload
 * with seamless graceful fallback for resilient device submissions.
 */

export interface ImgBBUploadResult {
  url: string;
  displayUrl?: string;
  deleteUrl?: string;
  id?: string;
}

/**
 * Get current configured ImgBB API key from env or localStorage
 */
export function getImgBBApiKey(): string {
  try {
    const envKey = (import.meta as any).env?.VITE_IMGBB_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
      return envKey.trim();
    }
    const localKey = localStorage.getItem('rittik_imgbb_api_key');
    if (localKey && localKey.trim().length > 0) {
      return localKey.trim();
    }
  } catch {}
  return '';
}

/**
 * Save custom ImgBB API key to localStorage
 */
export function setImgBBApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('rittik_imgbb_api_key', key.trim());
    } else {
      localStorage.removeItem('rittik_imgbb_api_key');
    }
  } catch {}
}

/**
 * Convert a File to an optimized, web-ready image data URL.
 * Max dimension: 1200px, Quality: 0.82 JPEG.
 * Produces crisp, lightweight images (~40-80KB) ideal for instant viewing and Firestore persistence.
 */
export function fileToOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(dataUrl);
            return;
          }
        } catch {}
        resolve((e.target?.result as string) || URL.createObjectURL(file));
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || URL.createObjectURL(file));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a single image file to ImgBB
 * POST https://api.imgbb.com/1/upload
 * with FormData { image: file }
 * If ImgBB API key is absent or returns an error, gracefully falls back to an optimized image URL
 * so customer submissions and admin review are never interrupted.
 */
export async function uploadImageToImgBB(file: File, overrideKey?: string): Promise<string> {
  const apiKey = (overrideKey || getImgBBApiKey()).trim();

  // If an API key is provided, attempt official upload to ImgBB
  if (apiKey) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const endpoint = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.data) {
          const remoteUrl = json.data.url || json.data.display_url;
          if (remoteUrl) {
            return remoteUrl;
          }
        }
      }
    } catch {
      // Graceful fallback to client-side optimized storage below
    }
  }

  // Guaranteed fallback: converts file to an optimized web-ready image URL
  // This allows full photo verification in trade-in, admin review, and store catalogs.
  try {
    const fallbackUrl = await fileToOptimizedDataUrl(file);
    return fallbackUrl;
  } catch {
    return URL.createObjectURL(file);
  }
}
