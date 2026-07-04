"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { CustomerRow, CustomerPhone, CustomerAddress } from "@/types/customers";
import { parsePhones, parseAddresses } from "@/types/customers";
import { ImageUpload } from "@/components/ui/image-upload";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CustomerFormProps = {
  initial?: CustomerRow;
  error: string | null;
  disabled: boolean;
  onSubmit: (formData: FormData) => void;
};

export function CustomerForm({ initial, error, disabled, onSubmit }: CustomerFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    Array.isArray(initial?.tags) ? (initial.tags as string[]) : [],
  );
  const [phones, setPhones] = useState<CustomerPhone[]>(
    parsePhones(initial?.phones ?? []),
  );
  const [addresses, setAddresses] = useState<CustomerAddress[]>(
    parseAddresses(initial?.addresses ?? []),
  );

  const handleAvatarUpload = async (file: File) => {
    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `temp-avatars/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("customer-avatars").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) return { ok: false as const, error: "Upload failed. Please try again." };
    const { data } = supabase.storage.from("customer-avatars").getPublicUrl(path);
    return { ok: true as const, url: data.publicUrl };
  };

  const addTag = () => {
    const t = tagsInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagsInput("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const addPhone = () => {
    setPhones([...phones, { number: "", label: "Mobile", is_primary: phones.length === 0 }]);
  };

  const updatePhone = (i: number, patch: Partial<CustomerPhone>) => {
    setPhones(phones.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  };

  const removePhone = (i: number) => setPhones(phones.filter((_, idx) => idx !== i));

  const addAddress = () => {
    setAddresses([...addresses, { label: "", street: "", city: "", state: "", zip: "", country: "Bangladesh", is_default: addresses.length === 0 }]);
  };

  const updateAddress = (i: number, patch: Partial<CustomerAddress>) => {
    setAddresses(addresses.map((a, idx) => idx === i ? { ...a, ...patch } : a));
  };

  const removeAddress = (i: number) => setAddresses(addresses.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("avatar_url", avatarUrl ?? "");
    fd.set("tags", JSON.stringify(tags));
    fd.set("phones", JSON.stringify(phones));
    fd.set("addresses", JSON.stringify(addresses));
    onSubmit(fd);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-card-foreground">Name *</span>
          <input name="name" required defaultValue={initial?.name} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-card-foreground">Phone *</span>
          <input name="phone" required defaultValue={initial?.phone} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-card-foreground">Email</span>
          <input name="email" type="email" defaultValue={initial?.email ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-card-foreground">Business Name</span>
          <input name="business_name" defaultValue={(initial as any)?.business_name ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
        </label>
      </div>

      <ImageUpload value={avatarUrl} onChange={setAvatarUrl} onUpload={handleAvatarUpload} />

      <div className="space-y-2">
        <span className="text-sm font-medium text-card-foreground">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-blue-600 hover:text-blue-800 dark:text-blue-300"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add a tag..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
          <button type="button" onClick={addTag} disabled={!tagsInput.trim()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">Add Tag</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">Phone Numbers</span>
          <button type="button" onClick={addPhone} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"><Plus className="h-3 w-3" /> Add Phone</button>
        </div>
        {phones.map((p, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/20 p-3">
            <label className="flex-1 space-y-1">
              <span className="text-xs text-muted-foreground">Number</span>
              <input value={p.number} onChange={(e) => updatePhone(i, { number: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </label>
            <label className="w-24 space-y-1">
              <span className="text-xs text-muted-foreground">Label</span>
              <select value={p.label} onChange={(e) => updatePhone(i, { label: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500">
                <option>Mobile</option><option>Home</option><option>Work</option><option>Other</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
              <input type="checkbox" checked={p.is_primary} onChange={() => setPhones(phones.map((x, idx) => ({ ...x, is_primary: idx === i })))} className="rounded border-gray-300 text-blue-600" />
              Primary
            </label>
            <button type="button" onClick={() => removePhone(i)} className="pb-2 text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">Addresses</span>
          <button type="button" onClick={addAddress} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"><Plus className="h-3 w-3" /> Add Address</button>
        </div>
        {addresses.map((a, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={a.is_default} onChange={() => setAddresses(addresses.map((x, idx) => ({ ...x, is_default: idx === i })))} className="rounded border-gray-300 text-blue-600" />
                Default
              </label>
              <button type="button" onClick={() => removeAddress(i)} className="text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={a.label} onChange={(e) => updateAddress(i, { label: e.target.value })} placeholder="Label (e.g. Home, Office)" className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
              <input value={a.street} onChange={(e) => updateAddress(i, { street: e.target.value })} placeholder="Street" className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
              <input value={a.city} onChange={(e) => updateAddress(i, { city: e.target.value })} placeholder="City" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
              <input value={a.state} onChange={(e) => updateAddress(i, { state: e.target.value })} placeholder="State/Division" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
              <input value={a.zip} onChange={(e) => updateAddress(i, { zip: e.target.value })} placeholder="ZIP" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
              <input value={a.country} onChange={(e) => updateAddress(i, { country: e.target.value })} placeholder="Country" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500" />
            </div>
          </div>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500" />
      </label>

      {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button type="submit" disabled={disabled} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">Save Customer</button>
      </div>
    </form>
  );
}
