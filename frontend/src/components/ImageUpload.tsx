import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { uploadAPI } from '../services/api';

// Cloudinary direct-browser upload config (unsigned preset — safe to expose)
// Max 50MB per file
const MAX_FILE_SIZE_MB = 50;

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  multiple = false,
  label = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Upload a single file directly to Cloudinary from the browser.
   * This completely bypasses Vercel's 4.5 MB serverless body limit.
   * Supports up to 50 MB images.
   */
  const uploadToCloudinary = async (file: File): Promise<{ url: string; public_id: string }> => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
    }

    return await uploadAPI.uploadImage(file, (pct) => {
      setUploadProgress(`Uploading ${file.name}: ${pct}%`);
    });
  };

  const handleUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress('');
    try {
      if (multiple) {
        const results: { url: string; public_id: string }[] = [];
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);
          const result = await uploadToCloudinary(files[i]);
          results.push(result);
        }
        const newUrls = results.map(r => r.url);
        const currentUrls = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentUrls, ...newUrls]);
      } else {
        const result = await uploadToCloudinary(files[0]);
        onChange(result.url);
      }
      setUploadProgress('');
    } catch (err: any) {
      setUploadProgress('');
      alert(`Upload failed: ${err.message || 'Please use a valid image (JPG, PNG, WEBP) up to 50MB.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
  };

  const handleRemove = async (urlToRemove: string) => {
    // Best-effort server-side delete (Cloudinary delete via backend)
    try {
      await uploadAPI.deleteImage(urlToRemove);
    } catch {
      // Ignore delete errors — image is still removed from UI
    }

    if (multiple && Array.isArray(value)) {
      onChange(value.filter(url => url !== urlToRemove));
    } else {
      onChange('');
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const images = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (value && typeof value === 'string' ? [value] : []);

  return (
    <div className="space-y-2 font-sans text-xs">
      {label && <label className="font-bold text-luxury-muted block uppercase tracking-wider text-[10px]">{label}</label>}

      {/* Upload Zone */}
      {(multiple || images.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
            dragOver
              ? 'border-luxury-gold bg-luxury-cream/30'
              : 'border-[#EBE6DC] hover:border-luxury-gold hover:bg-[#FAF8F5]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple={multiple}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5 w-full">
              <RefreshCw className="w-5 h-5 text-luxury-gold animate-spin" />
              <span className="font-medium text-luxury-gold">{uploadProgress || 'Uploading to Cloudinary...'}</span>
              <div className="w-full max-w-xs bg-[#EBE6DC] rounded-full h-1 overflow-hidden">
                <div className="bg-luxury-gold h-1 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 text-luxury-muted" />
              <div>
                <span className="font-semibold text-luxury-dark block">Drag & Drop Image here</span>
                <span className="text-zinc-400 font-light block mt-0.5">or click to browse (JPG, PNG, WEBP — up to 50MB)</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((imgUrl, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden border border-[#EBE6DC] h-20 bg-[#FAF8F5]">
              <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                  className="p-1 bg-white rounded-full text-luxury-dark hover:text-luxury-gold transition-colors"
                  title="Replace"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(imgUrl); }}
                  className="p-1 bg-white rounded-full text-red-500 hover:text-red-700 transition-colors"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
