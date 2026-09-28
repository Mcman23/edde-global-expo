"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Check } from "lucide-react";

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Consultation",
  "Application",
  "Converted",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

interface StatusSelectProps {
  leadId: string;
  currentStatus: string;
}

export function StatusSelect({ leadId, currentStatus }: StatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus || "New");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const getStatusColor = (st: string) => {
    switch (st) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400";
      case "Contacted":
        return "bg-purple-50 text-edde-vivid border-purple-200 focus:ring-purple-400";
      case "Consultation":
        return "bg-amber-50 text-amber-800 border-amber-200 focus:ring-amber-400";
      case "Application":
        return "bg-cyan-50 text-cyan-800 border-cyan-200 focus:ring-cyan-400";
      case "Converted":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-400";
      case "Lost":
        return "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-400";
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const prevStatus = status;

    // Optimistic UI update
    setStatus(newStatus);
    setUpdating(true);
    setSuccess(false);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from("leads")
        .update({ lead_status: newStatus })
        .eq("id", leadId);

      if (error) {
        console.error("Failed to update lead status:", error);
        // Revert on error
        setStatus(prevStatus);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
      setStatus(prevStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={updating}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 transition-all cursor-pointer shadow-sm ${getStatusColor(
          status
        )} disabled:opacity-50`}
      >
        {LEAD_STATUSES.map((st) => (
          <option key={st} value={st} className="bg-white text-gray-900 font-medium">
            {st}
          </option>
        ))}
      </select>

      {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-edde-purple shrink-0" />}
      {success && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
    </div>
  );
}
