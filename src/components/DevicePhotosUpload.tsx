import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Plus, 
  Loader2, 
  Key, 
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { uploadImageToImgBB, getImgBBApiKey, setImgBBApiKey } from '../utils/imgbb';

export interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface DevicePhotosUploadProps {
  onImagesReady: (urls: string[]) => void;
  required?: boolean;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export const DevicePhotosUpload: React.FC<DevicePhotosUploadProps> = ({
  onImagesReady,
  required = true,
  onUploadStateChange
}) => {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [globalUploadStatus, setGlobalUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [statusText, setStatusText] = useState<string>('');
  
  // ImgBB API Key Modal / Config State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getImgBBApiKey());
  const [hasApiKey, setHasApiKey] = useState(!!getImgBBApiKey());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<SelectedPhoto[]>([]);
  photosRef.current = photos;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    };
  }, []);

  // Handle files selected via input
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setErrorMessage(null);

    const newFiles = Array.from(selectedFiles);

    // Enforce max 4 images constraint
    if (photos.length + newFiles.length > 4) {
      setErrorMessage('You can upload a maximum of 4 photos.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newPhotos: SelectedPhoto[] = newFiles.map((file) => ({
      id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    const updatedList = [...photos, ...newPhotos].slice(0, 4);
    setPhotos(updatedList);

    // Reset file input so user can pick the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Automatically initiate upload to ImgBB
    uploadAllPending(updatedList);
  };

  // Remove a photo before or after upload
  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);

    const target = photos.find((p) => p.id === id);
    if (target && target.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);

    // Re-evaluate global status
    if (next.length === 0) {
      setGlobalUploadStatus('idle');
      setStatusText('');
    } else if (next.every((p) => p.status === 'success')) {
      setGlobalUploadStatus('success');
      setStatusText('Images uploaded successfully.');
    }

    const successfulUrls = next
      .filter((p) => p.status === 'success' && p.uploadedUrl)
      .map((p) => p.uploadedUrl as string);
    onImagesReady(successfulUrls);
  };

  // Upload all pending photos to ImgBB separately
  const uploadAllPending = async (currentPhotos = photos) => {
    const pending = currentPhotos.filter((p) => p.status !== 'success');
    if (pending.length === 0) {
      const alreadyReady = currentPhotos
        .filter((p) => p.status === 'success' && p.uploadedUrl)
        .map((p) => p.uploadedUrl as string);
      onImagesReady(alreadyReady);
      return;
    }

    setGlobalUploadStatus('uploading');
    setStatusText('Uploading images...');
    setErrorMessage(null);
    onUploadStateChange?.(true);

    let currentList = [...currentPhotos];
    let hasAnyError = false;

    // Process each selected image separately
    for (let i = 0; i < currentList.length; i++) {
      const photo = currentList[i];
      if (photo.status === 'success') continue;

      currentList[i] = { ...photo, status: 'uploading' };
      setPhotos([...currentList]);

      try {
        const uploadedUrl = await uploadImageToImgBB(photo.file);
        currentList[i] = {
          ...photo,
          status: 'success',
          uploadedUrl,
          errorMessage: undefined
        };
        setPhotos([...currentList]);
      } catch {
        hasAnyError = true;
        currentList[i] = {
          ...photo,
          status: 'error',
          errorMessage: 'Failed to upload image. Please try again.'
        };
        setPhotos([...currentList]);
      }
    }

    if (hasAnyError) {
      setGlobalUploadStatus('error');
      setStatusText('Failed to upload image. Please try again.');
      setErrorMessage('Failed to upload image. Please try again.');
    } else {
      setGlobalUploadStatus('success');
      setStatusText('Images uploaded successfully.');
    }

    const successfulUrls = currentList
      .filter((p) => p.status === 'success' && p.uploadedUrl)
      .map((p) => p.uploadedUrl as string);
    onImagesReady(successfulUrls);
    onUploadStateChange?.(false);
  };

  // Save custom ImgBB key
  const handleSaveApiKey = () => {
    setImgBBApiKey(apiKeyInput.trim());
    setHasApiKey(!!apiKeyInput.trim());
    setShowKeyModal(false);
    // If there were failed photos, re-trigger upload
    uploadAllPending();
  };

  return (
    <div className="space-y-3.5">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Device Photos</span>
              {required && <span className="text-rose-400 text-xs font-bold">*</span>}
            </h3>
            <p className="text-[11px] text-slate-400">
              Select 1 to 4 clear photos of your device (front, back, screen & sides).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            {photos.length} / 4
          </span>
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title="ImgBB API Key Settings"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition-colors text-[10px] flex items-center gap-1"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ImgBB Config</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Error Banner if limit exceeded or upload failed */}
      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {globalUploadStatus === 'error' && (
            <button
              type="button"
              onClick={() => uploadAllPending()}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Global Status Message */}
      {statusText && !errorMessage && (
        <div
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            globalUploadStatus === 'uploading'
              ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
              : globalUploadStatus === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border border-slate-800 text-slate-300'
          }`}
        >
          {globalUploadStatus === 'uploading' && (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          )}
          {globalUploadStatus === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusText}</span>
        </div>
      )}

      {/* Image Preview & Selection Area */}
      <div className="space-y-3">
        {photos.length === 0 ? (
          /* Empty state / Select Photos trigger */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-cyan-400/80 bg-slate-950/50 hover:bg-slate-900/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1 group-hover:text-cyan-300">
              Select Photos
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-3">
              Upload up to 4 real photos of your device. Supported formats: JPG, JPEG, PNG, WEBP.
            </p>
            <button
              type="button"
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Photos</span>
            </button>
          </div>
        ) : (
          /* Responsive Photos Grid */
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <img
                    src={photo.previewUrl}
                    alt={`Device photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow">
                      {index === 0 ? 'Main Photo' : `#${index + 1} Gallery`}
                    </span>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemovePhoto(photo.id, e)}
                      title="Remove this image"
                      className="pointer-events-auto p-1.5 rounded-full bg-slate-950/80 hover:bg-rose-900/90 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/80 transition-all shadow-lg active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Indicator at Bottom */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-md p-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    {photo.status === 'uploading' && (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading...
                      </span>
                    )}
                    {photo.status === 'success' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Uploaded (ImgBB)
                      </span>
                    )}
                    {photo.status === 'error' && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Upload Failed
                      </span>
                    )}
                    {photo.status === 'pending' && (
                      <span className="text-slate-400 font-semibold">
                        Queued
                      </span>
                    )}

                    <span className="text-slate-500 font-mono truncate max-w-[70px]">
                      {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              ))}

              {/* Add More Photos slot if fewer than 4 */}
              {photos.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-400/60 bg-slate-900/40 hover:bg-slate-900/80 flex flex-col items-center justify-center p-3 text-center transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 flex items-center justify-center mb-1.5 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-cyan-300">
                    Add Photo
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    ({4 - photos.length} remaining)
                  </span>
                </button>
              )}
            </div>

            {/* Quick Actions under Grid */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-850 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select More Photos</span>
                  </button>
                )}
                {photos.some((p) => p.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => uploadAllPending()}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Failed Uploads</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                {photos.filter((p) => p.status === 'success').length} of {photos.length} photos ready
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ImgBB API Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>ImgBB API Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              The customer device photos are uploaded directly to ImgBB (
              <a
                href="https://api.imgbb.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline inline-flex items-center gap-0.5"
              >
                api.imgbb.com <ExternalLink className="w-3 h-3" />
              </a>
              ). Enter your free ImgBB API Key below or leave blank to use the project default.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                ImgBB API Key
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="e.g. 2d5b621e2576b5d3a571932402120045"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
