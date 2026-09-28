import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-admin";
import { StatusSelect } from "./status-select";
import {
  Users,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  GraduationCap,
  Calendar,
  Gift,
  Search,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

export const revalidate = 0; // Dynamic server table

interface LeadRecord {
  id: string;
  lead_status: string;
  full_name: string;
  whatsapp_number: string;
  email: string;
  preferred_destination: string;
  study_level: string;
  intended_intake: string;
  quiz_answers: Record<string, unknown> | null;
  recommendation: Record<string, unknown> | null;
  offer_title: string | null;
  campaign: string | null;
  source: string | null;
  created_at: string;
}

export default async function AdminLeadsPage() {
  const supabase = createServiceClient();

  const { data: leadsData, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
  }

  const leads: LeadRecord[] = leadsData || [];

  // Sanitize phone number for wa.me link
  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return "#";
    const cleaned = phone.replace(/[^\d+]/g, "");
    const formatted = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
    return `https://wa.me/${formatted}`;
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-edde-purple font-poppins">
              Student Leads Roster
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-edde-purple rounded-full">
              {leads.length} Total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage expo consultations, change student status, and contact leads via WhatsApp.
          </p>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-card overflow-hidden">
        {leads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-edde-purple mb-4">
              <Users className="w-8 h-8 text-edde-vivid" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-poppins">No leads captured yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              When students complete the EDDE Global Expo quiz and submit their contact details,
              they will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/60 text-[11px] font-extrabold text-edde-purple uppercase tracking-wider border-b border-purple-100">
                  <th className="py-3.5 px-4 sm:px-6">Candidate Details</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Level & Intake</th>
                  <th className="py-3.5 px-4">Quiz Result</th>
                  <th className="py-3.5 px-4">Offer & Campaign</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right sm:pr-6">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {leads.map((lead) => {
                  const waUrl = formatWhatsAppLink(lead.whatsapp_number);
                  const primaryDest =
                    lead.preferred_destination ||
                    (lead.recommendation as { primary_destination?: string })
                      ?.primary_destination ||
                    "Undecided";

                  const recommendationTitle =
                    (lead.recommendation as { title?: string; primary_destination?: string })
                      ?.title || null;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-purple-50/30 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-4 sm:px-6 font-medium">
                        <div className="font-bold text-gray-900 text-sm text-edde-purple">
                          {lead.full_name || "Anonymous Lead"}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          {lead.whatsapp_number && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                              title="Chat on WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{lead.whatsapp_number}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-edde-purple"
                            >
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{lead.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Preferred Destination */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-edde-purple font-bold rounded-lg border border-purple-100">
                          <Globe className="w-3 h-3 text-edde-vivid" />
                          <span>{primaryDest}</span>
                        </span>
                      </td>

                      {/* Study Level & Intake */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">
                          {lead.study_level || "Not specified"}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{lead.intended_intake || "Immediate"}</span>
                        </div>
                      </td>

                      {/* Quiz Result / Recommendation */}
                      <td className="py-4 px-4 max-w-xs">
                        {recommendationTitle ? (
                          <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px]">
                            <div className="font-bold text-edde-purple flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-edde-vivid" />
                              <span>{recommendationTitle}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-500 italic">
                            Completed Assessment
                          </div>
                        )}
                      </td>

                      {/* Offer & Campaign */}
                      <td className="py-4 px-4">
                        {lead.offer_title ? (
                          <div className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                            <Gift className="w-3 h-3 text-amber-600" />
                            <span>{lead.offer_title}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">
                            {lead.campaign ? `Campaign: ${lead.campaign}` : "Standard Registration"}
                          </span>
                        )}
                      </td>

                      {/* Date Created */}
                      <td className="py-4 px-4 text-[11px] text-gray-500 whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4 sm:pr-6 text-right whitespace-nowrap">
                        <StatusSelect
                          leadId={lead.id}
                          currentStatus={lead.lead_status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
