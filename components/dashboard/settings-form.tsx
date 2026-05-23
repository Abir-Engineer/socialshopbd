"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const TABS = [
  { key: "shop", label: "Shop settings" },
  { key: "business", label: "Business info" },
  { key: "notifications", label: "Notifications" },
  { key: "security", label: "Security" },
  { key: "subscription", label: "Subscription" },
  { key: "danger", label: "Danger zone" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type ToastItem = { id: number; message: string; variant: "success" | "error" };

function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
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
      const shopSettings = {
        name: shopName.trim(),
        description: shopDescription.trim(),
        currency: shopCurrency,
        address: shopAddress.trim(),
        logo_url: shopLogoPreview,
      };

      if (shopLogoFile && (section === "shop" || section === "business" || section === "notifications")) {
        try {
          shopSettings.logo_url = await readFileAsDataURL(shopLogoFile);
        } catch {
          setError("Unable to read shop logo image. Please choose another file.");
          return;
        }
      }

      const settingsData = {
        ...metadata,
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
          setError("Shop URL slug cannot be empty and must be alphanumeric.");
          setIsSaving(false);
          setSavingTab(null);
          return;
        }

        // Upsert to shops table
        const { error: dbError } = await supabase.from("shops").upsert({
          user_id: user!.id,
          shop_name: shopName.trim(),
          slug: cleanedSlug,
          currency: shopCurrency,
          address: shopAddress.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (dbError) {
          setError("Failed to sync shop metadata: " + dbError.message);
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
          setError("New password and confirm password do not match.");
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
        setInfo("Nothing to save for this section.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser(updates);
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo("Settings saved successfully.");
      showToast("Saved successfully.", "success");
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
      showToast(`Successfully upgraded to ${plan} Plan!`, "success");
    } else {
      showToast(`Upgrade failed: ${updateError.message}`, "error");
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
        setError(result.error || "Unable to delete account.");
        return;
      }
      showToast("Account deleted.", "success");
      await getSupabaseBrowserClient().auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Failed to delete account. Please try again.");
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Settings</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Configure your shop</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage shop details, notifications, security and subscriptions from one place.
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
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Settings</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">App settings</h1>
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Shop settings</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Shop details</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("shop")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "shop" && isSaving ? "Saving…" : "Save shop settings"}
              </button>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">Shop name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder="Social Shop BD"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Currency</label>
                  <select
                    value={shopCurrency}
                    onChange={(event) => setShopCurrency(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                  >
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Shop URL Slug</label>
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
                    Your public checkout page will be live at:{" "}
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
                <label className="block text-sm font-medium text-foreground">Shop description</label>
                <textarea
                  value={shopDescription}
                  onChange={(event) => setShopDescription(event.target.value)}
                  rows={4}
                  placeholder="Describe your shop and what you sell."
                  className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Address</label>
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
                  <p className="text-sm font-medium text-foreground">Shop logo</p>
                  <p className="mt-2 text-sm text-muted-foreground">Upload a logo for your shop profile.</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-background">
                      {shopLogoPreview ? (
                        <img src={shopLogoPreview} alt="Shop logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Preview</span>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-slate-700">
                      Upload logo
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Business info</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Owner details</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("business")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "business" && isSaving ? "Saving…" : "Save business info"}
              </button>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground">Owner name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Owner name"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Business type</label>
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Service">Service</option>
                  <option value="Marketplace">Marketplace</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Website</label>
                <input
                  type="url"
                  value={websiteLink}
                  onChange={(event) => setWebsiteLink(event.target.value)}
                  placeholder="https://yourshop.com"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Facebook page link</label>
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Notifications</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Notification settings</h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection("notifications")}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingTab === "notifications" && isSaving ? "Saving…" : "Save notification settings"}
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Email notifications",
                  state: emailNotifications,
                  setter: setEmailNotifications,
                  description: "Receive platform updates and order summaries by email.",
                },
                {
                  label: "Order alerts",
                  state: orderAlerts,
                  setter: setOrderAlerts,
                  description: "Be notified when new orders arrive.",
                },
                {
                  label: "Low stock alerts",
                  state: lowStockAlerts,
                  setter: setLowStockAlerts,
                  description: "Get alerts when inventory runs low.",
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Security</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Password & sessions</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveSection("security")}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingTab === "security" && isSaving ? "Saving…" : "Change password"}
                </button>
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="inline-flex items-center justify-center rounded-3xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Logout from all devices
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Changing your password will keep you logged in unless your session refreshes.
            </p>
          </section>
        ) : null}

        {activeTab === "subscription" ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Subscription & Billing</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">SaaS Subscription Management</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose the plan that fits your business scaling needs.</p>
            </div>

            {/* Current Active Plan Status Banner */}
            <div className="rounded-3xl border border-border bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Currently Active</p>
                <h3 className="text-2xl font-black mt-1 text-foreground">{currentPlan} Plan</h3>
                <p className="text-sm text-muted-foreground mt-1">Valid until <span className="font-semibold text-foreground">{currentExpiry}</span></p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ● Active Status
                </span>
                <p className="text-xs text-muted-foreground mt-2">Auto-renew is disabled</p>
              </div>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: "Starter", price: "Free", limit: "100 orders/mo", desc: "For starting micro-merchants.", popular: false },
                { name: "Growth", price: "BDT 1,500/mo", limit: "1,000 orders/mo", desc: "For scaling social shops.", popular: true },
                { name: "Enterprise", price: "BDT 4,500/mo", limit: "Unlimited orders", desc: "For full commerce automation.", popular: false }
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
                      Most Popular
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
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPricingModalSelectedPlan(tier.name as any);
                        setShowPricingModal(true);
                      }}
                      className={`mt-6 w-full rounded-2xl py-2.5 text-xs font-semibold transition ${
                        tier.popular
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Upgrade to {tier.name}
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
                <p className="text-xs uppercase tracking-widest text-rose-500">Danger zone</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Delete account</h2>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              Deleting your account will remove all your user data, shop settings, and sessions. This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="mt-6 inline-flex items-center justify-center rounded-3xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Delete account
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
            <h3 className="text-xl font-semibold text-foreground">Confirm account deletion</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This action is irreversible. If you delete your account, all saved settings and profile data will be removed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex items-center justify-center rounded-3xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-3xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Deleting…" : "Yes, delete account"}
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
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Upgrade Request</span>
              <h3 className="text-xl font-extrabold text-foreground mt-1">Select Payment Gateway</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Upgrading to <span className="font-semibold text-foreground">{pricingModalSelectedPlan} Plan</span> (Price: {pricingModalSelectedPlan === "Growth" ? "BDT 1,500" : "BDT 4,500"}/month)
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
                  <span className="text-sm font-bold text-foreground">Pay with bKash</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Instant activation via bKash MFS</p>
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
                  <span className="text-sm font-bold text-foreground">Cards / Netbanking</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Rocket, Nagad</p>
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
                Cancel
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
              <div className="font-bold text-lg tracking-wide uppercase">bKash Payment</div>
              <div className="text-[10px] opacity-90 mt-1">Merchant: SocialShop BD Ltd</div>
              <div className="text-xl font-black mt-2">
                ৳ {pricingModalSelectedPlan === "Growth" ? "1,500.00" : "4,500.00"}
              </div>
              <div className="absolute top-2 right-2 text-white/50 text-[10px] font-mono">Invoice: INV-SUB-{Date.now().toString().slice(-4)}</div>
            </div>

            {/* bKash Payment Wizard Body */}
            <div className="p-6 bg-slate-50 text-neutral-800 space-y-6">
              {bkashStep === "phone" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    Enter your bKash personal account number (11 digits)
                  </div>
                  <input
                    type="text"
                    value={bkashPhone}
                    onChange={(e) => setBkashPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full text-center border-b-2 border-[#E2136E] bg-transparent py-2 text-lg font-bold outline-none text-neutral-800 placeholder-neutral-400 focus:border-neutral-800"
                  />
                  <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                    By clicking on <b>Proceed</b>, you are agreeing to the terms & conditions of bKash merchant integration.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setGatewaySelection(null);
                        setBkashStep(null);
                      }}
                      className="w-1/2 bg-neutral-300 py-2.5 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-400 uppercase"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        if (bkashPhone.length === 11) setBkashStep("otp");
                      }}
                      disabled={bkashPhone.length !== 11}
                      className="w-1/2 bg-[#E2136E] text-white py-2.5 rounded text-xs font-bold hover:bg-[#c0105b] uppercase disabled:opacity-50"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "otp" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    A 6-digit verification code has been sent to <span className="font-bold">{bkashPhone}</span>
                  </div>
                  <input
                    type="text"
                    value={bkashOTP}
                    onChange={(e) => setBkashOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter OTP (e.g. 123456)"
                    className="w-full text-center border-b-2 border-[#E2136E] bg-transparent py-2 text-lg font-bold outline-none text-neutral-800 placeholder-neutral-400 focus:border-neutral-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBkashStep("phone")}
                      className="w-1/2 bg-neutral-300 py-2.5 rounded text-xs font-bold text-neutral-700 hover:bg-neutral-400 uppercase"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (bkashOTP.length === 6) setBkashStep("pin");
                      }}
                      disabled={bkashOTP.length !== 6}
                      className="w-1/2 bg-[#E2136E] text-white py-2.5 rounded text-xs font-bold hover:bg-[#c0105b] uppercase disabled:opacity-50"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "pin" && (
                <div className="space-y-4">
                  <div className="text-center text-xs font-medium text-neutral-600">
                    Enter your 5-digit bKash PIN to confirm transaction
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
                      Back
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
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {bkashStep === "loading" && (
                <div className="py-6 text-center space-y-4 flex flex-col items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2136E] border-t-transparent" />
                  <div>
                    <p className="text-sm font-bold text-neutral-700">Verifying secure MFS gateway...</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Executing smart payment billing contract. Please wait.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* authentic footer branding */}
            <div className="bg-[#bd105c] py-2 text-center text-[10px] text-white font-medium uppercase tracking-widest">
              Secured by bKash 24/7
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
