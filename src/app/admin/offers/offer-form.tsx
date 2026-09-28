"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Gift, Plus, Check, Loader2, X, Calendar, Tag } from "lucide-react";

export interface Offer {
  id?: string;
  title: string;
  description: string;
  cta_text: string;
  campaign: string;
  active: boolean;
  expires_at: string | null;
  created_at?: string;
}

interface OfferFormProps {
  initialData?: Offer | null;
  onCancel?: () => void;
}

export function OfferForm({ initialData, onCancel }: OfferFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [ctaText, setCtaText] = useState(initialData?.cta_text || "Claim Expo Benefit");
  const [campaign, setCampaign] = useState(initialData?.campaign || "EDDE Expo 2026");
  const [active, setActive] = useState<boolean>(initialData?.active ?? true);
  const [expiresAt, setExpiresAt] = useState<string>(
    initialData?.expires_at ? initialData.expires_at.slice(0, 16) : ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title || !description || !ctaText) {
      setErrorMsg("Please fill in Title, Description, and CTA Button text.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const payload = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        title: title.trim(),
        description: description.trim(),
        cta_text: ctaText.trim(),
        campaign: campaign.trim() || null,
        active,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const { error } = await supabase.from("offers").upsert(payload);

      if (error) {
        console.error("Error saving offer:", error);
        setErrorMsg("Failed to save offer. Please verify your permissions.");
      } else {
        router.refresh();
        if (onCancel) onCancel();
      }
    } catch (err) {
      console.error("Unexpected error saving offer:", err);
      setErrorMsg("An unexpected error occurred while saving the offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-card">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-edde-purple">
            <Gift className="w-4 h-4 text-edde-vivid" />
          </div>
          <h2 className="text-lg font-bold text-edde-purple font-poppins">
            {initialData?.id ? "Edit Expo Offer / Benefit" : "Create Premium Expo Benefit"}
          </h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Benefit Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. EDDE Expo 2026 Executive Counseling & Application Fee Waiver"
            className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-edde-vivid focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Description / Inclusions <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed service inclusions, scholarship assessment terms, and fast-track eligibility..."
            className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-edde-vivid focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CTA Text */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              CTA Button Text <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. Claim Expo Consultation"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-edde-vivid focus:outline-none"
            />
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Campaign Tag
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. EDDE Expo 2026"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-edde-vivid focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Expiration Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3.5 py-2 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-edde-vivid focus:outline-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 pt-4 sm:pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-edde-vivid rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-edde-vivid" />
            </label>
            <span className="text-xs font-bold text-gray-800">
              {active ? "Active for Expo Visitors" : "Inactive (Hidden)"}
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-edde-purple to-edde-vivid hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-glow inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-edde-yellow" />
            ) : (
              <Check className="w-4 h-4 text-edde-yellow" />
            )}
            <span>{initialData?.id ? "Update Offer" : "Save Offer"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
