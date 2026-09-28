import { createServiceClient } from "@/lib/supabase-admin";
import { BarChart3, Activity, Clock, Layers, Filter } from "lucide-react";

export const revalidate = 0; // Dynamic server analytics page

interface AnalyticsEvent {
  id?: string;
  event_name: string;
  session_id: string;
  source: string | null;
  campaign: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export default async function AdminAnalyticsPage() {
  const supabase = createServiceClient();

  const { data: eventsData, error } = await supabase
    .from("analytics_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching analytics events:", error);
  }

  const events: AnalyticsEvent[] = eventsData || [];

  const getEventBadgeColor = (name: string) => {
    switch (name) {
      case "landing_view":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "webar_started":
      case "webar_completed":
        return "bg-purple-50 text-edde-vivid border-purple-200";
      case "webar_fallback":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "quiz_started":
      case "quiz_completed":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "lead_submitted":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "whatsapp_clicked":
        return "bg-teal-50 text-teal-800 border-teal-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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
              Raw Analytics Event Stream
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-edde-purple rounded-full">
              Last 100 Events
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time audit log of user interactions, WebAR session triggers, and quiz conversions.
          </p>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-card overflow-hidden">
        {events.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Activity className="w-12 h-12 text-edde-vivid mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-gray-900 font-poppins">
              No analytics events recorded yet
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Events such as landing page views, WebAR launches, quiz completions, and WhatsApp clicks will stream here live.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/60 text-[11px] font-extrabold text-edde-purple uppercase tracking-wider border-b border-purple-100">
                  <th className="py-3.5 px-4 sm:px-6">Event Name</th>
                  <th className="py-3.5 px-4">Session ID</th>
                  <th className="py-3.5 px-4">Source / Campaign</th>
                  <th className="py-3.5 px-4">UTM Parameters</th>
                  <th className="py-3.5 px-4 text-right sm:pr-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-mono">
                {events.map((ev, index) => (
                  <tr
                    key={ev.id || index}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    {/* Event Name */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getEventBadgeColor(
                          ev.event_name
                        )}`}
                      >
                        <Activity className="w-3 h-3 shrink-0" />
                        <span>{ev.event_name}</span>
                      </span>
                    </td>

                    {/* Session ID */}
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                      {ev.session_id ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                          {ev.session_id.slice(0, 18)}...
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Source / Campaign */}
                    <td className="py-3.5 px-4 text-gray-800 text-xs font-sans">
                      <span className="font-semibold text-edde-purple">
                        {ev.source || "expo_qr"}
                      </span>
                      {ev.campaign && (
                        <span className="text-[11px] text-gray-500 block">
                          Campaign: {ev.campaign}
                        </span>
                      )}
                    </td>

                    {/* UTM Parameters */}
                    <td className="py-3.5 px-4 text-[11px] text-gray-500 font-sans">
                      {ev.utm_source || ev.utm_medium || ev.utm_campaign ? (
                        <div className="space-y-0.5">
                          {ev.utm_source && <div>src: {ev.utm_source}</div>}
                          {ev.utm_campaign && <div>cmp: {ev.utm_campaign}</div>}
                        </div>
                      ) : (
                        <span className="text-gray-400">Direct / Organic</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 sm:pr-6 text-right text-[11px] text-gray-500 font-sans whitespace-nowrap">
                      {formatDate(ev.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
