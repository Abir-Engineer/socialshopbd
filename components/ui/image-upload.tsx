"use client";

import { useId, useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";

type ImageUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({ value, onChange, onUpload, disabled, className = "" }: ImageUploadProps) {
  const uid = useId();
  const [preview, setPreview] = useState<string | null>(value);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview && preview !== value && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const result = await onUpload(file);

    if (!result.ok) {
      setError(result.error);
      setPreview(value);
      URL.revokeObjectURL(objectUrl);
      setIsUploading(false);
      return;
    }

    onChange(result.url);
    setIsUploading(false);
  };

  const handleRemove = () => {
    if (preview && preview !== value && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <span className="text-sm font-medium text-card-foreground">Product Image</span>

      {preview ? (
        <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border border-border bg-muted/30">
          <img
            src={preview}
            alt="Product preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80 disabled:opacity-50"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={`image-upload-${uid}`}
          className={`flex aspect-square w-full max-w-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition hover:border-blue-400 hover:bg-muted/40 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs font-medium">
            {isUploading ? "Uploading..." : "Click to upload"}
          </span>
          <span className="text-[10px]">PNG, JPG, WebP (max 5MB)</span>
        </label>
      )}

      <input
        id={`image-upload-${uid}`}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
