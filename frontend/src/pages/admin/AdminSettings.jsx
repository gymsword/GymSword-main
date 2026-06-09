import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useSite } from "@/context/SiteContext";
import { ADMIN } from "@/constants/testIds";

const DEFAULT = {
  hero_headline: "",
  hero_subheadline: "",
  announcement_bar: "",
  coming_soon: false,
  show_prices: true,
  enable_purchases: true,
};

export default function AdminSettings() {
  const { refresh: refreshSite } = useSite();
  const [s, setS] = useState(DEFAULT);
  const [envFlag, setEnvFlag] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then(({ data }) => {
      setS({
        hero_headline: data.hero_headline || "",
        hero_subheadline: data.hero_subheadline || "",
        announcement_bar: data.announcement_bar || "",
        coming_soon: !!data.coming_soon,
        show_prices: data.show_prices !== false,
        enable_purchases: data.enable_purchases !== false,
      });
      setEnvFlag(!!data.coming_soon_env);
    });
  }, []);

  const persist = async (next) => {
    setSaving(true);
    try {
      await api.patch("/admin/settings", next);
      refreshSite();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (key) => {
    const next = { ...s, [key]: !s[key] };
    setS(next);
    await persist({ [key]: next[key] });
  };

  const saveCopy = async () => {
    await persist({
      hero_headline: s.hero_headline,
      hero_subheadline: s.hero_subheadline,
      announcement_bar: s.announcement_bar,
    });
  };

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <div className="text-overline text-white/50">Website Settings</div>
        <h1 className="font-display uppercase font-black text-4xl mt-2">Launch Controls</h1>
        <p className="text-sm text-white/60 mt-2 max-w-2xl">
          Master switches for the storefront. Toggle each control to instantly reflect across the live site.
        </p>
      </div>

      <section className="bg-white/5 border border-white/10 divide-y divide-white/10">
        <ToggleRow
          testId="admin-coming-soon-toggle"
          title="Coming Soon Mode"
          desc="Blurs product imagery behind a sharp GymSword logo. Use for pre-launch teaser."
          value={s.coming_soon}
          onToggle={() => toggle("coming_soon")}
          rightHint={
            <span className="text-overline text-white/40">
              Env default: {envFlag ? "ON" : "OFF"}
            </span>
          }
        />
        <ToggleRow
          testId="admin-show-prices-toggle"
          title="Show Prices"
          desc="When OFF, all product prices are hidden from the storefront."
          value={s.show_prices}
          onToggle={() => toggle("show_prices")}
        />
        <ToggleRow
          testId="admin-enable-purchases-toggle"
          title="Enable Purchases"
          desc="When OFF, customers cannot add to bag or check out. Browsing remains active."
          value={s.enable_purchases}
          onToggle={() => toggle("enable_purchases")}
        />
      </section>

      {saving && <div className="text-overline text-white/50">Saving…</div>}

      <section className="bg-white/5 border border-white/10 p-6 space-y-4">
        <div className="text-overline text-white/50">Storefront Copy</div>
        <F label="Hero Headline" value={s.hero_headline} onChange={(v) => setS({ ...s, hero_headline: v })} />
        <F label="Hero Subheadline" value={s.hero_subheadline} onChange={(v) => setS({ ...s, hero_subheadline: v })} />
        <F label="Announcement Bar" value={s.announcement_bar} onChange={(v) => setS({ ...s, announcement_bar: v })} />
        <button data-testid={ADMIN.settingsSave} onClick={saveCopy} className="btn-luxury-light mt-2">
          Save Copy
        </button>
      </section>

      <section className="bg-white/5 border border-white/10 p-6">
        <div className="text-overline text-white/50 mb-2">Currency</div>
        <div className="font-display text-2xl">₹ INR · Indian Rupees</div>
        <div className="text-xs text-white/40 mt-2">All prices, taxes and Stripe charges are denominated in INR. GST applied at 18% by default.</div>
      </section>
    </div>
  );
}

function ToggleRow({ testId, title, desc, value, onToggle, rightHint }) {
  return (
    <div className="flex items-center justify-between gap-4 p-6">
      <div className="flex-1">
        <div className="font-display uppercase text-base">{title}</div>
        <div className="text-sm text-white/60 mt-1">{desc}</div>
        {rightHint && <div className="mt-2">{rightHint}</div>}
      </div>
      <button
        data-testid={testId}
        onClick={onToggle}
        aria-pressed={value}
        className={`relative w-14 h-7 flex-shrink-0 border transition ${
          value ? "bg-white border-white" : "bg-transparent border-white/40"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 transition-all ${
            value ? "left-7 bg-black" : "left-0.5 bg-white"
          }`}
        />
      </button>
      <div className="w-20 text-right text-overline text-white/70">{value ? "ON" : "OFF"}</div>
    </div>
  );
}

function F({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-overline text-white/50 mb-2">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white text-white"
      />
    </label>
  );
}
