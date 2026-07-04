"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertOrgSetting } from "@/lib/settings/service";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/settings/display";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  initial: {
    legal_name: string;
    tax_id: string;
    address: string;
    owner_name: string;
    business_type: string;
    website: string;
    facebook: string;
  };
}

export function BusinessInfoSection({ orgId, initial }: Props) {
  const [legalName, setLegalName] = useState(initial.legal_name);
  const [taxId, setTaxId] = useState(initial.tax_id);
  const [address, setAddress] = useState(initial.address);
  const [ownerName, setOwnerName] = useState(initial.owner_name);
  const [businessType, setBusinessType] = useState(initial.business_type);
  const [website, setWebsite] = useState(initial.website);
  const [facebook, setFacebook] = useState(initial.facebook);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const bizData = { legal_name: legalName, tax_id: taxId, address };
    await supabase.from("business_info").upsert({ organization_id: orgId, ...bizData }, { onConflict: "organization_id" });
    await upsertOrgSetting(supabase, orgId, "business_info", { owner_name: ownerName, business_type: businessType, website, facebook } as never);
    setSaving(false);
    toast.success("Business information has been saved successfully.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
          <p className="text-sm text-muted-foreground">Legal business details for invoices and compliance.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {saving ? "Saving..." : "Save Business Info"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Legal name</label>
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tax ID / BIN</label>
          <input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Owner name</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Business type</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          >
            <option value="">Select type</option>
            {BUSINESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Facebook page</label>
          <input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/yourpage"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Business address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
