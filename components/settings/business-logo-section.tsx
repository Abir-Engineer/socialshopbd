"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertShop, fetchShop } from "@/lib/settings/service";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

interface Props {
  userId: string;
  initialLogoUrl: string | null;
  initialShopName: string;
}

export function BusinessLogoSection({ userId, initialLogoUrl, initialShopName }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `shop-logos/${userId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl ?? null;

    if (publicUrl) {
      const { error } = await upsertShop(supabase, userId, { logo_url: publicUrl });
      if (error) {
        toast.error("Failed to save logo URL.");
        return;
      }
      setLogoUrl(publicUrl);
      toast.success("Logo updated.");
    }
  };

  const handleRemove = async () => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await upsertShop(supabase, userId, { logo_url: null });
    if (error) {
      toast.error("Failed to remove logo.");
      return;
    }
    setLogoUrl(null);
    toast.success("Logo removed.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Business Logo</h2>
          <p className="text-sm text-muted-foreground">Upload your business logo for invoices and the checkout page.</p>
        </div>
      </div>
      <div className="flex items-start gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={96} height={96} className="object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">No logo</span>
          )}
        </div>
        <div className="space-y-3">
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted-foreground/15 transition">
            Upload logo
            <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
          </label>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="block rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 transition cursor-pointer"
            >
              Remove
            </button>
          )}
          <p className="text-xs text-muted-foreground">PNG, JPG or WebP. Max 2MB. Square recommended.</p>
        </div>
      </div>
    </div>
  );
}
