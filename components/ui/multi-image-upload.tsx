"use client";

import { useId, useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";

type MultiImageUploadProps = {
  values: string[];
  onChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  disabled?: boolean;
  maxImages?: number;
};

export function MultiImageUpload({
  values,
  onChange,
  onUpload,
  disabled,
  maxImages = 6,
}: MultiImageUploadProps) {
  const uid = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = maxImages - values.length;
    const toUpload = files.slice(0, remaining);

    if (toUpload.length < files.length) {
      setError(`Maximum ${maxImages} images allowed`);
    } else {
      setError(null);
    }

    setIsUploading(true);

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not a supported image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds the 5MB size limit`);
        continue;
      }

      const result = await onUpload(file);
      if (result.ok) {
        onChange([...values, result.url]);
      } else {
        setError(result.error);
      }
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const next = values.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleMove = (from: number, to: number) => {
    const next = [...values];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const canAddMore = values.length < maxImages;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-card-foreground">
        Additional Images ({values.length}/{maxImages})
      </span>

      <div className="flex flex-wrap gap-3">
        {values.map((url, index) => (
          <div
            key={url}
            className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted/30"
          >
            <img
              src={url}
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 transition group-hover:bg-black/30">
              <button
                type="button"
                onClick={() => handleMove(index, Math.max(0, index - 1))}
                disabled={index === 0 || disabled}
                className="hidden rounded bg-white/90 p-1 text-slate-700 transition hover:bg-white group-hover:block disabled:hidden"
                aria-label="Move left"
              >
                <GripVertical className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="hidden rounded bg-white/90 p-1 text-rose-600 transition hover:bg-white group-hover:block"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {canAddMore && (
          <label
            htmlFor={`multi-upload-${uid}`}
            className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition hover:border-blue-400 hover:bg-muted/40 ${disabled || isUploading ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Plus className="h-5 w-5" />
          </label>
        )}
      </div>

      <input
        id={`multi-upload-${uid}`}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={disabled || isUploading || !canAddMore}
        multiple
        className="hidden"
      />

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
