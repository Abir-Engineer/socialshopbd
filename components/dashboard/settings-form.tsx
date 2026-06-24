"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const TABS = [
  { key: "shop", label: "দোকান সেটিংস" },
  { key: "business", label: "ব্যবসায়িক তথ্য" },
  { key: "notifications", label: "নোটিফিকেশন" },
  { key: "security", label: "নিরাপত্তা" },
  { key: "subscription", label: "সাবস্ক্রিপশন" },
  { key: "danger", label: "বিপদ অঞ্চল" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type ToastItem = { id: number; message: string; variant: "success" | "error" };

function compressAndResizeImage(file: File, maxW = 400, maxH = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface ShopSettings {
  name?: string;
  description?: string;
  currency?: string;
  address?: string;
  logo_url?: string | null;
}

interface BusinessInfo {
  ownerName?: string;
  type?: string;
  website?: string;
  facebook?: string;
}

interface NotificationSettings {
  email?: boolean;
  orderAlerts?: boolean;
  lowStockAlerts?: boolean;
}

export function SettingsForm() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("shop");
  const [isSaving, setIsSaving] = useState(false);
  const [savingTab, setSavingTab] = useState<TabKey | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);
  const router = useRouter();

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopCurrency, setShopCurrency] = useState("BDT");
  const [shopLogoFile, setShopLogoFile] = useState<File | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [subStatus, setSubStatus] = useState("active");
  const [subStartDate, setSubStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [subEndDate, setSubEndDate] = useState<string | null>(null);
  const [shopLogoPreview, setShopLogoPreview] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(false);
  const [orderAlerts, setOrderAlerts] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Dynamic Subscription & Payment states
  const [currentPlan, setCurrentPlan] = useState("Starter");
  const [currentExpiry, setCurrentExpiry] = useState("2026-06-30");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalSelectedPlan, setPricingModalSelectedPlan] = useState<"Growth" | "Enterprise" | null>(null);
  const [gatewaySelection, setGatewaySelection] = useState<"bKash" | "SSLCommerz" | null>(null);
  const [bkashStep, setBkashStep] = useState<"phone" | "otp" | "pin" | "loading" | null>(null);
  const [bkashPhone, setBkashPhone] = useState("");
  const [bkashOTP, setBkashOTP] = useState("");
  const [bkashPIN, setBkashPIN] = useState("");
  const [invoiceNum] = useState(() => Date.now().toString().slice(-4));

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setError(error.message);
      }
      if (data.user) {
        const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
        const shop = (metadata.shopSettings || {}) as ShopSettings;
        const business = (metadata.businessInfo || {}) as BusinessInfo;
        const notifications = (metadata.notificationSettings || {}) as NotificationSettings;
        const subPlan = (metadata.subscriptionPlan || "Starter") as string;
        const subExpiry = (metadata.subscriptionExpiry || "2026-06-30") as string;

        setUser(data.user);
        setCurrentPlan(subPlan);
        setCurrentExpiry(subExpiry);
        setShopName(shop.name || "");
        setShopDescription(shop.description || "");
        setShopAddress(shop.address || "");
        setShopCurrency(shop.currency || "BDT");
        setShopLogoPreview(shop.logo_url || null);

        setOwnerName(business.ownerName || "");
        setBusinessType(business.type || "");
        setWebsiteLink(business.website || "");
        setFacebookLink(business.facebook || "");

        setEmailNotifications(Boolean(notifications.email));
        setOrderAlerts(Boolean(notifications.orderAlerts));
        setLowStockAlerts(Boolean(notifications.lowStockAlerts));

        // Fetch shops table settings
        supabase.from("shops").select("*").eq("user_id", data.user.id).maybeSingle().then(({ data: dbShop }) => {
          if (dbShop) {
            setShopSlug(dbShop.slug);
            if (dbShop.shop_name) setShopName(dbShop.shop_name);
            if (dbShop.address) setShopAddress(dbShop.address);
            if (dbShop.currency) setShopCurrency(dbShop.currency);
            if (dbShop.logo_url) setShopLogoPreview(dbShop.logo_url);
          } else {
            // Auto generate slug from email
            const defaultSlug = (data.user.email || "").split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "myshop";
            setShopSlug(defaultSlug);
          }
        });

        // Fetch user organization role
        supabase.from("organization_members").select("role").eq("user_id", data.user.id).limit(1).maybeSingle().then(({ data: membership }) => {
          if (membership) {
            setUserRole(membership.role);
          }
        });

        // Fetch organization ID
        supabase.from("organization_members").select("organization_id").eq("user_id", data.user.id).limit(1).maybeSingle().then(({ data: membership }) => {
          if (membership) {
            setOrgId(membership.organization_id);
          }
        });
      }
      setIsLoadingUser(false);
    });
  }, []);



  const showToast = (message: string, variant: ToastItem["variant"]) => {
    const id = ++toastSeq.current;
    setToastItems((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToastItems((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const isSectionActive = (key: TabKey) => activeTab === key;

  const handleShopLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setShopLogoFile(file);
    if (shopLogoPreview && shopLogoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(shopLogoPreview);
    }
    setShopLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveSection = async (section: TabKey) => {
    setError(null);
    setInfo(null);
    setIsSaving(true);
    setSavingTab(section);

    try {
      const supabase = getSupabaseBrowserClient();
      const updates: { data?: Record<string, unknown>; password?: string } = {};
      const metadata = (user?.user_metadata || {}) as Record<string, unknown>;
      let finalLogoUrl = shopLogoPreview;

      if (shopLogoFile && (section === "shop" || section === "business" || section === "notifications")) {
        try {
          finalLogoUrl = await compressAndResizeImage(shopLogoFile);
        } catch {
          setError("দোকানের লোগো ইমেজ পড়া যাচ্ছে না। অনুগ্রহ করে অন্য একটি ফাইল নির্বাচন করুন।");
          setIsSaving(false);
          setSavingTab(null);
          return;
        }
      }

      // Omit logo_url from user_metadata to prevent cookie bloat
      const shopSettings = {
        name: shopName.trim(),
        description: shopDescription.trim(),
        currency: shopCurrency,
        address: shopAddress.trim(),
      };

      // Clean up legacy bloated logo_url from existing user_metadata
      const cleanMetadata = { ...metadata };
      if (cleanMetadata.shopSettings) {
        const cleanShopSettings = { ...(cleanMetadata.shopSettings as Record<string, unknown>) };
        delete cleanShopSettings.logo_url;
        cleanMetadata.shopSettings = cleanShopSettings;
      }

      const settingsData = {
        ...cleanMetadata,
        shopSettings,
        businessInfo: {
          ownerName: ownerName.trim(),
          type: businessType,
          website: websiteLink.trim(),
          facebook: facebookLink.trim(),
        },
        notificationSettings: {
          email: emailNotifications,
          orderAlerts,
          lowStockAlerts,
        },
      };

      if (section === "shop") {
        const cleanedSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (!cleanedSlug) {
          setError("দোকানের ইউআরএল স্লাগ খালি হতে পারবে না এবং আলফানিউমেরিক হতে হবে।");
          setIsSaving(false);
          setSavingTab(null);
          return;
        }

        // Upsert to shops table, including the logo_url
        const { error: dbError } = await supabase.from("shops").upsert({
          user_id: user!.id,
          shop_name: shopName.trim(),
          slug: cleanedSlug,
          currency: shopCurrency,
          address: shopAddress.trim(),
          logo_url: finalLogoUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (dbError) {
          setError("দোকানের মেটাডেটা সিঙ্ক করতে ব্যর্থ: " + dbError.message);
          setIsSaving(false);
          setSavingTab(null);
          return;
        }
      }

      if (section === "shop" || section === "business" || section === "notifications") {
        updates.data = settingsData;
      }

      if (section === "security") {
        if (newPassword && newPassword !== confirmPassword) {
          setError("নতুন পাসওয়ার্ড এবং পাসওয়ার্ড নিশ্চিতকরণ মেলে না।");
          setIsSaving(false);
          setSavingTab(null);
          return;
        }
        if (newPassword) {
          updates.password = newPassword;
        }
        updates.data = settingsData;
      }

      if (!updates.data && !updates.password) {
        setInfo("এই বিভাগের জন্য সংরক্ষণ করার কিছু নেই।");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser(updates);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (section === "business" && orgId) {
        await supabase.from("business_info").upsert({
          organization_id: orgId,
          legal_name: legalName,
          tax_id: taxId,
          address: businessAddress,
        });
      }

      if (section === "notifications" && orgId) {
        await supabase.from("notifications").upsert({
          organization_id: orgId,
          user_id: user!.id,
          type: notificationType,
          message: notificationMessage,
          read: false,
        });
      }

      if (section === "subscription" && orgId) {
        await supabase.from("subscriptions").upsert({
          organization_id: orgId,
          plan: currentPlan,
          status: subStatus,
          start_date: subStartDate,
          end_date: subEndDate,
        });
      }

      setInfo("সেটিংস সফলভাবে সংরক্ষিত হয়েছে।");
      showToast("সফলভাবে সংরক্ষিত হয়েছে।", "success");
      if (section === "security") {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setIsSaving(false);
      setSavingTab(null);
    }
  };

  const handlePaymentSuccess = async (plan: string) => {
    const supabase = getSupabaseBrowserClient();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const formattedExpiry = expiryDate.toISOString().split("T")[0];

    const updates = {
      data: {
        ...user?.user_metadata,
        subscriptionPlan: plan,
        subscriptionExpiry: formattedExpiry,
      }
    };

    const { error: updateError } = await supabase.auth.updateUser(updates);
    if (!updateError) {
      setCurrentPlan(plan);
      setCurrentExpiry(formattedExpiry);
      showToast(`${plan} প্ল্যানে সফলভাবে আপগ্রেড করা হয়েছে!`, "success");
    } else {
      showToast(`আপগ্রেড ব্যর্থ হয়েছে: ${updateError.message}`, "error");
    }
  };

  const handleLogoutAllDevices = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setInfo(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/delete-account", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "অ্যাকাউন্ট মুছতে অক্ষম।");
        return;
      }
      showToast("অ্যাকাউন্ট মুছে ফেলা হয়েছে।", "success");
      await getSupabaseBrowserClient().auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
      <aside className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">সেটিংস</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">আপনার দোকান কনফিগার করুন</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            এক জায়গা থেকে দোকানের বিবরণ, নোটিফিকেশন, নিরাপত্তা এবং সাবস্ক্রিপশন পরিচালনা করুন।
          </p>
        </div>

        <div className="space-y-2">
          {TABS.filter((tab) => {
            if (userRole !== "owner") {
              return tab.key !== "subscription" && tab.key !== "danger";
            }
            return true;
          }).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${
                isSectionActive(tab.key)
                  ? "bg-blue-600 text-white"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </aside>

      <main className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">সেটিংস</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">অ্যাপ সেটিংস</h1>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{user?.email}</span>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {info ? (
          <div className="rounded-3xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{info}</div>
        ) : null}

        {activeTab === "shop" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">দোকান সেটিংস</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">দোকানের বিবরণ</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("shop")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "shop" && isSaving ? "সংরক্ষণ করা হচ্ছে…" : "দোকান সেটিংস সংরক্ষণ"}
              </button>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">দোকানের নাম</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder="Social Shop BD"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">মুদ্রা</label>
                  <select
                    value={shopCurrency}
                    onChange={(event) => setShopCurrency(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                  >
                    <option value="BDT">বিডিটি</option>
                    <option value="USD">ইউএসডি</option>
                    <option value="EUR">ইইউআর</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">দোকানের ইউআরএল স্লাগ</label>
                <div className="mt-2 flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground focus-within:border-blue-500 transition">
                  <span className="text-muted-foreground mr-1 select-none">/checkout/</span>
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(event) => setShopSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="my-awesome-shop"
                    className="w-full bg-transparent outline-none"
                  />
                </div>
                {shopSlug && (
                  <p className="mt-2 text-xs text-muted-foreground">
                                        আপনার পাবলিক চেকআউট পেজ এখানে লাইভ হবে: {" "}
                    <a
                      href={`/checkout/${shopSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      /checkout/{shopSlug} ↗
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">বিবরণ</label>
                <textarea
                  value={shopDescription}
                  onChange={(event) => setShopDescription(event.target.value)}
                  rows={4}
                  placeholder="আপনার দোকান এবং আপনি কী বিক্রি করেন তা বর্ণনা করুন।"
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">ঠিকানা</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(event) => setShopAddress(event.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[240px_1fr] items-end">
                <div className="rounded-3xl border border-border bg-muted p-4">
                  <p className="text-sm font-medium text-foreground">লোগো</p>
                  <p className="mt-2 text-sm text-muted-foreground">আপনার দোকান প্রোফাইলের জন্য একটি লোগো আপলোড করুন।</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-background">
                      {shopLogoPreview ? (
                        <img src={shopLogoPreview} alt="Shop logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm text-muted-foreground">প্রিভিউ</span>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-slate-700">
                      লোগো আপলোড
                      <input type="file" accept="image/*" onChange={handleShopLogoChange} className="sr-only" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "business" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">ব্যবসায়িক তথ্য</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">মালিকের বিবরণ</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("business")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "business" && isSaving ? "সংরক্ষণ করা হচ্ছে…" : "ব্যবসায়িক তথ্য সংরক্ষণ"}
              </button>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground">মালিকের নাম</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="মালিকের নাম"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">ব্যবসায়ের ধরন</label>
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                >
                  <option value="">ধরন নির্বাচন করুন</option>
                  <option value="Retail">খুচরা</option>
                  <option value="Wholesale">পাইকারি</option>
                  <option value="Service">সার্ভিস</option>
                  <option value="Marketplace">মার্কেটপ্লেস</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">ওয়েবসাইট</label>
                <input
                  type="url"
                  value={websiteLink}
                  onChange={(event) => setWebsiteLink(event.target.value)}
                  placeholder="https://yourshop.com"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">ফেসবুক পেজ লিংক</label>
                <input
                  type="url"
                  value={facebookLink}
                  onChange={(event) => setFacebookLink(event.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "notifications" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">নোটিফিকেশন</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">নোটিফিকেশন সেটিংস</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("notifications")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "notifications" && isSaving ? "সংরক্ষণ করা হচ্ছে…" : "নোটিফিকেশন সেটিংস সংরক্ষণ"}
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "ইমেল নোটিফিকেশন",
                  state: emailNotifications,
                  setter: setEmailNotifications,
                  description: "ইমেলের মাধ্যমে প্ল্যাটফর্ম আপডেট এবং অর্ডার সারসংক্ষেপ গ্রহণ করুন।",
                },
                {
                  label: "অর্ডার সতর্কতা",
                  state: orderAlerts,
                  setter: setOrderAlerts,
                  description: "নতুন অর্ডার এলে বিজ্ঞপ্তি পান।",
                },
                {
                  label: "স্বল্প স্টক সতর্কতা",
                  state: lowStockAlerts,
                  setter: setLowStockAlerts,
                  description: "ইনভেন্টরি কম হলে সতর্কতা পান।",
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center justify-between rounded-3xl border border-border bg-background px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(event) => item.setter(event.target.checked)}
                    className="h-5 w-5 rounded border border-border text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "security" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">নিরাপত্তা</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">পাসওয়ার্ড ও সেশন</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveSection("security")}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingTab === "security" && isSaving ? "সংরক্ষণ করা হচ্ছে…" : "পাসওয়ার্ড পরিবর্তন"}
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="inline-flex items-center justify-center rounded-3xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  সমস্ত ডিভাইস থেকে লগআউট
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">বর্তমান পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="নতুন পাসওয়ার্ড"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="নতুন পাসওয়ার্ড নিশ্চিত করুন"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              আপনার পাসওয়ার্ড পরিবর্তন করলে আপনি লগইন থাকবেন, যতক্ষণ না আপনার সেশন রিফ্রেশ হয়।
            </p>
          </section>
        ) : null}

        {activeTab === "subscription" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">সাবস্ক্রিপশন ও বিলিং</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">সাবস্ক্রিপশন ব্যবস্থাপনা</h2>
              <p className="mt-1 text-sm text-muted-foreground">আপনার ব্যবসার স্কেলিং প্রয়োজনের উপযোগী প্ল্যান বেছে নিন।</p>
            </div>

            {/* Current Active Plan Status Banner */}
            <div className="rounded-3xl border border-border bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">বর্তমানে সক্রিয়</p>
                <h3 className="text-2xl font-black mt-1 text-foreground">{currentPlan} প্ল্যান</h3>
                <p className="text-sm text-muted-foreground mt-1">বৈধ পর্যন্ত <span className="font-semibold text-foreground">{currentExpiry}</span></p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ● সক্রিয় অবস্থা
                </span>
                <p className="text-xs text-muted-foreground mt-2">অটো-রিনিউ অক্ষম</p>
              </div>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Starter", price: "ফ্রি", limit: "মাসে ১০০ অর্ডার", desc: "ক্ষুদ্র ব্যবসায়ীদের শুরুর জন্য।", popular: false },
                { name: "Growth", price: "মাসে বিডিটি ১,৫০০", limit: "মাসে ১,০০০ অর্ডার", desc: "সোশ্যাল শপ স্কেল করার জন্য।", popular: true },
                { name: "Enterprise", price: "মাসে বিডিটি ৪,৫০০", limit: "সীমাহীন অর্ডার", desc: "পূর্ণ কমার্স অটোমেশনের জন্য।", popular: false }
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-3xl border p-6 flex flex-col justify-between transition hover:shadow-lg ${
                    tier.name === currentPlan
                      ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500"
                      : tier.popular
                        ? "border-indigo-500 bg-indigo-500/5"
                        : "border-border bg-background"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                      সর্বাধিক জনপ্রিয়
                    </span>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{tier.name}</h4>
                    <p className="mt-2 text-2xl font-black text-foreground">{tier.price}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tier.limit}</p>
                    <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{tier.desc}</p>
                  </div>
                  
                  {tier.name === currentPlan ? (
                    <button
                      disabled
                      className="mt-6 w-full rounded-2xl bg-blue-500/20 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-default"
                    >
                      বর্তমান প্ল্যান
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPricingModalSelectedPlan(tier.name as "Growth" | "Enterprise");
                        setShowPricingModal(true);
                      }}
                      className={`mt-6 w-full rounded-2xl py-2.5 text-xs font-semibold transition ${
                        tier.popular
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {tier.name} এ আপগ্রেড করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "danger" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-rose-500">বিপদ অঞ্চল</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">অ্যাকাউন্ট মুছুন</h2>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              আপনার অ্যাকাউন্ট মুছে ফেললে আপনার সমস্ত ব্যবহারকারী ডেটা, দোকান সেটিংস এবং সেশন মুছে যাবে। এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না।
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="mt-6 inline-flex items-center justify-center rounded-3xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              অ্যাকাউন্ট মুছুন
            </button>
          </section>
        ) : null}
      </main>

      {toastItems.length > 0 ? (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {toastItems.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-3xl px-4 py-3 text-sm shadow-xl ${
                toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">অ্যাকাউন্ট মুছে ফেলার নিশ্চিতকরণ</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              এই ক্রিয়া অপরিবর্তনীয়। আপনি যদি আপনার অ্যাকাউন্ট মুছে ফেলেন, তাহলে সমস্ত সংরক্ষিত সেটিংস এবং প্রোফাইল ডেটা সরিয়ে ফেলা হবে।
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex items-center justify-center rounded-3xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-3xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "মুছে ফেলা হচ্ছে…" : "হ্যাঁ, অ্যাকাউন্ট মুছুন"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* SaaS Pricing Gateway Modal */}
      {showPricingModal && pricingModalSelectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">আপগ্রেড অনুরোধ</span>
              <h3 className="text-xl font-extrabold text-foreground mt-1">পেমেন্ট গেটওয়ে নির্বাচন করুন</h3>
              <p className="text-sm text-muted-foreground mt-2">
                এ আপগ্রেড করা হচ্ছে <span className="font-semibold text-foreground">{pricingModalSelectedPlan} প্ল্যান</span> (মূল্য: {pricingModalSelectedPlan === "Growth" ? "বিডিটি ১,৫০০" : "বিডিটি ৪,৫০০"}/মাস)
              </p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => {
                  setGatewaySelection("bKash");
                  setBkashStep("phone");
                }}
                className="flex items-center justify-between rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 text-left transition hover:bg-pink-500/10 focus:outline-none"
              >
                <div>
                  <span className="text-sm font-bold text-foreground">বিকাশ দিয়ে পেমেন্ট</span>
                  <p className="text-xs text-muted-foreground mt-0.5">বিকাশ এমএফএস এর মাধ্যমে তাৎক্ষণিক অ্যাক্টিভেশন</p>
                </div>
                <div className="rounded-full bg-[#E2136E] text-white font-bold text-xs px-3 py-1.5 uppercase">
                  bKash
                </div>
              </button>

              <button
                onClick={() => {
                  setGatewaySelection("SSLCommerz");
                  setBkashStep("loading");
                  setTimeout(() => {
                    handlePaymentSuccess(pricingModalSelectedPlan);
                    setPricingModalSelectedPlan(null);
                    setShowPricingModal(false);
                    setGatewaySelection(null);
                    setBkashStep(null);
                  }, 1800);
                }}
                className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-left transition hover:bg-blue-500/10 focus:outline-none"
              >
                <div>
                  <span className="text-sm font-bold text-foreground">কার্ড / নেটব্যাংকিং</span>
                  <p className="text-xs text-muted-foreground mt-0.5">ভিসা, মাস্টারকার্ড, রকেট, নগদ</p>
                </div>
                <div className="rounded-full bg-blue-600 text-white font-bold text-[10px] px-2 py-1.5 uppercase">
                  SSLCommerz
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPricingModal(false);
                  setPricingModalSelectedPlan(null);
                }}
                className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Premium bKash Gateway Dialog */}
      {gatewaySelection === "bKash" && bkashStep !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl border border-neutral-200">
            
            {/* Authentic bKash Brand Header */}
            <div className="bg-[#E2136E] p-4 text-white text-center flex flex-col items-center relative">
              <div className="font-bold text-lg tracking-wide uppercase">বিকাশ পেমেন্ট</div>
              <div className="text-[10px] opacity-90 mt-1">Merchant: SocialShop BD Ltd</div>
              <div className="text-xl font-black mt-2">
                ৳ {pricingModalSelectedPlan === "Growth" ? "1,500.00" : "4,500.00"}
              </div>
              <div className="absolute top-2 right-2 text-white/50 text-[10px] font-mono">চালান: INV-SUB-{invoiceNum}</div>
            </div>

            {/* bKash Payment Wizard Body */}
            <div className="p-6 bg-slate-50 text-neutral-800 space-y-6">
              {bkashStep === "phone" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    আপনার বিকাশ ব্যক্তিগত অ্যাকাউন্ট নম্বর লিখুন (১১ ডিজিট)
                  </div>
                  <input
                    type="text"
                    value={bkashPhone}
                    onChange={(e) => setBkashPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="যেমন ০১৭XXXXXXXX"
                    className="w-full text-center border-b-2 border-[#E2136E] bg-transparent py-2 text-lg font-bold outline-none text-neutral-800 placeholder-neutral-400 focus:border-neutral-800"
                  />
                  <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                    <b>এগিয়ে যান</b> এ ক্লিক করার মাধ্যমে, আপনি বিকাশ মার্চেন্ট ইন্টিগ্রেশনের শর্তাবলীতে সম্মত হচ্ছেন।
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setGatewaySelection(null);
                        setBkashStep(null);
                      }}
                      className="w-1/2 bg-neutral-300 py-2.5 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-400 uppercase"
                    >
                      বন্ধ
                    </button>
                    <button
                      onClick={() => {
                        if (bkashPhone.length === 11) setBkashStep("otp");
                      }}
                      disabled={bkashPhone.length !== 11}
                      className="w-1/2 bg-[#E2136E] text-white py-2.5 rounded text-xs font-bold hover:bg-[#c0105b] uppercase disabled:opacity-50"
                    >
                      এগিয়ে যান
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "otp" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    একটি ৬-অঙ্কের ভেরিফিকেশন কোড পাঠানো হয়েছে <span className="font-bold">{bkashPhone}</span> এ
                  </div>
                  <input
                    type="text"
                    value={bkashOTP}
                    onChange={(e) => setBkashOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="ওটিপি লিখুন (যেমন ১২৩৪৫৬)"
                    className="w-full text-center border-b-2 border-[#E2136E] bg-transparent py-2 text-lg font-bold outline-none text-neutral-800 placeholder-neutral-400 focus:border-neutral-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBkashStep("phone")}
                      className="w-1/2 bg-neutral-300 py-2.5 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-400 uppercase"
                    >
                      পেছনে
                    </button>
                    <button
                      onClick={() => {
                        if (bkashOTP.length === 6) setBkashStep("pin");
                      }}
                      disabled={bkashOTP.length !== 6}
                      className="w-1/2 bg-[#E2136E] text-white py-2.5 rounded text-xs font-bold hover:bg-[#c0105b] uppercase disabled:opacity-50"
                    >
                      এগিয়ে যান
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "pin" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    লেনদেন নিশ্চিত করতে আপনার ৫-অঙ্কের বিকাশ পিন লিখুন
                  </div>
                  <input
                    type="password"
                    value={bkashPIN}
                    onChange={(e) => setBkashPIN(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="•••••"
                    className="w-full text-center border-b-2 border-[#E2136E] bg-transparent py-2 text-lg font-bold outline-none text-neutral-800 placeholder-neutral-400 focus:border-neutral-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBkashStep("otp")}
                      className="w-1/2 bg-neutral-300 py-2.5 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-400 uppercase"
                    >
                      পেছনে
                    </button>
                    <button
                      onClick={() => {
                        if (bkashPIN.length === 5) {
                          setBkashStep("loading");
                          setTimeout(() => {
                            handlePaymentSuccess(pricingModalSelectedPlan!);
                            setPricingModalSelectedPlan(null);
                            setShowPricingModal(false);
                            setGatewaySelection(null);
                            setBkashStep(null);
                            setBkashPhone("");
                            setBkashOTP("");
                            setBkashPIN("");
                          }, 2000);
                        }
                      }}
                      disabled={bkashPIN.length !== 5}
                      className="w-1/2 bg-[#E2136E] text-white py-2.5 rounded text-xs font-bold hover:bg-[#c0105b] uppercase disabled:opacity-50"
                    >
                      নিশ্চিত করুন
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "loading" && (
                <div className="py-6 text-center space-y-4 flex flex-col items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2136E] border-t-transparent" />
                  <div>
                    <p className="text-sm font-bold text-neutral-700">সুরক্ষিত এমএফএস গেটওয়ে যাচাই করা হচ্ছে...</p>
                    <p className="text-[10px] text-neutral-500 mt-1">স্মার্ট পেমেন্ট বিলিং কন্ট্রাক্ট এক্সিকিউট করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* authentic footer branding */}
            <div className="bg-[#bd105c] py-2 text-center text-[10px] text-white font-medium uppercase tracking-widest">
              বিকাশ ২৪/৭ দ্বারা সুরক্ষিত
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
