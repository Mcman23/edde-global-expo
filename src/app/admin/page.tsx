import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-admin";
import {
  Users,
  TrendingUp,
  PhoneCall,
  Sparkles,
  Eye,
  CheckCircle2,
  Globe,
  GraduationCap,
  Briefcase,
  DollarSign,
  Layers,
  ArrowRight,
} from "lucide-react";

export const revalidate = 0; // Fresh metrics on every request

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Fetch counts and records for aggregation
  // NOTE ON ARCHITECTURE:
  // Data volume for EDDE Global Expo is MVP-sized. Fetching records and aggregating in JS
  // allows multi-dimensional breakdowns (destinations, study levels, budget categories) in a single pass
  // without creating complex SQL functions or views in Supabase.

  const [
    sessionsCountRes,
    leadsRes,
    analyticsEventsRes,
    quizResultsRes,
  ] = await Promise.all([
    supabase.from("quiz_sessions").select("session_id", { count: "exact", head: true }),
    supabase.from("leads").select("*"),
    supabase.from("analytics_events").select("event_name, source, campaign, created_at"),
    supabase.from("quiz_results").select("*"),
  ]);

  const totalSessions = sessionsCountRes.count || 0;
  const leads = leadsRes.data || [];
  const events = analyticsEventsRes.data || [];
  const quizResults = quizResultsRes.data || [];

  // Aggregate event counts per event_name
  const eventCounts: Record<string, number> = {};
  events.forEach((ev) => {
    if (ev.event_name) {
      eventCounts[ev.event_name] = (eventCounts[ev.event_name] || 0) + 1;
    }
  });

  const landingViews = eventCounts["landing_view"] || 0;
  const webarStarted = eventCounts["webar_started"] || 0;
  const webarCompleted = eventCounts["webar_completed"] || 0;
  const webarFallback = eventCounts["webar_fallback"] || 0;
  const quizStarted = eventCounts["quiz_started"] || 0;
  const quizCompleted = eventCounts["quiz_completed"] || 0;
  const resultViewed = eventCounts["result_viewed"] || 0;
  const offerViewed = eventCounts["offerViewed"] || eventCounts["offer_viewed"] || 0;
  const leadFormStarted = eventCounts["lead_form_started"] || 0;
  const leadSubmitted = eventCounts["lead_submitted"] || leads.length;
  const whatsappClicked = eventCounts["whatsapp_clicked"] || 0;

  // Lead Conversion Rate calculation: (lead_submitted / landing_view) * 100
  const conversionRate = landingViews > 0
    ? ((leadSubmitted / landingViews) * 100).toFixed(1)
    : leads.length > 0 && totalSessions > 0
    ? ((leads.length / totalSessions) * 100).toFixed(1)
    : "0.0";

  // Funnel Stages Definition
  const funnelStages = [
    { name: "Landing View", count: landingViews, key: "landing_view" },
    { name: "WebAR Started", count: webarStarted, key: "webar_started" },
    { name: "WebAR Completed", count: webarCompleted, key: "webar_completed" },
    { name: "Quiz Started", count: quizStarted, key: "quiz_started" },
    { name: "Quiz Completed", count: quizCompleted, key: "quiz_completed" },
    { name: "Result Viewed", count: resultViewed, key: "result_viewed" },
    { name: "Offer Viewed", count: offerViewed, key: "offer_viewed" },
    { name: "Lead Form Started", count: leadFormStarted, key: "lead_form_started" },
    { name: "Lead Submitted", count: leadSubmitted, key: "lead_submitted" },
    { name: "WhatsApp Clicked", count: whatsappClicked, key: "whatsapp_clicked" },
  ];

  const firstStageCount = Math.max(landingViews, 1);

  // Aggregation 1: Destination Preferences
  const destinationMap: Record<string, number> = {};
  leads.forEach((l) => {
    const dest = l.preferred_destination || "Undecided";
    destinationMap[dest] = (destinationMap[dest] || 0) + 1;
  });
  quizResults.forEach((r) => {
    const dest = r.primary_destination || "Undecided";
    if (!destinationMap[dest]) {
      destinationMap[dest] = 1;
    }
  });

  const sortedDestinations = Object.entries(destinationMap).sort(
    (a, b) => b[1] - a[1]
  );

  // Aggregation 2: Study Levels
  const studyLevelMap: Record<string, number> = {};
  leads.forEach((l) => {
    const level = l.study_level || "Not specified";
    studyLevelMap[level] = (studyLevelMap[level] || 0) + 1;
  });
  const sortedStudyLevels = Object.entries(studyLevelMap).sort((a, b) => b[1] - a[1]);

  // Aggregation 3: Fields of Study & Intakes
  const intakeMap: Record<string, number> = {};
  leads.forEach((l) => {
    const intake = l.intended_intake || "Not specified";
    intakeMap[intake] = (intakeMap[intake] || 0) + 1;
  });

  // Aggregation 4: Budget Categories (from quiz_answers / quiz_results)
  const budgetMap: Record<string, number> = {};
  quizResults.forEach((r) => {
    const budget = r.budget_category || (r.recommendation && (r.recommendation as { budget_category?: string }).budget_category) || "Standard";
    budgetMap[budget] = (budgetMap[budget] || 0) + 1;
  });
  leads.forEach((l) => {
    if (l.quiz_answers && typeof l.quiz_answers === "object") {
      const qa = l.quiz_answers as Record<string, unknown>;
      const budget = (qa.budget || qa.budget_range || qa.budget_category) as string;
      if (budget && typeof budget === "string") {
        budgetMap[budget] = (budgetMap[budget] || 0) + 1;
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-edde-purple font-poppins">
              Expo Analytics Dashboard
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold text-edde-vivid bg-purple-100 rounded-full">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time booth traffic, interactive WebAR engagement, quiz completion, and student leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-edde-purple to-edde-vivid hover:opacity-90 rounded-xl shadow-glow transition-all"
          >
            <Users className="w-4 h-4 text-edde-yellow" />
            <span>View All Leads ({leads.length})</span>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Expo Sessions</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-edde-purple">
              <Eye className="w-5 h-5 text-edde-vivid" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900 font-poppins">
              {totalSessions.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Landing views: {landingViews.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 2: Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Captured Leads</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-edde-purple">
              <Users className="w-5 h-5 text-edde-vivid" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-edde-purple font-poppins">
              {leads.length.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Lead form completions: {leadSubmitted}
            </p>
          </div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Lead Conversion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-gray-900 font-poppins flex items-baseline gap-1">
              <span>{conversionRate}%</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                High
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Submitted leads vs landing visitors
            </p>
          </div>
        </div>

        {/* Card 4: WhatsApp Clicks */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">WhatsApp Enquiries</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-700 font-poppins">
              {whatsappClicked.toLocaleString()}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Direct counselor chat requests
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Funnel Chart & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Funnel Visualization */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-edde-purple flex items-center gap-2">
                <Layers className="w-5 h-5 text-edde-vivid" />
                <span>Expo Conversion Funnel</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Stage progression from initial scan/visit down to lead capture & WhatsApp chat.
              </p>
            </div>
            <span className="text-xs font-semibold text-edde-purple bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              CSS Chart Engine
            </span>
          </div>

          {/* Simple Clean CSS Bar Funnel Chart */}
          <div className="space-y-4">
            {funnelStages.map((stage) => {
              const pctOfFirst = Math.round((stage.count / firstStageCount) * 100);
              const barWidth = stage.count > 0 ? Math.max(pctOfFirst, 4) : 2;

              return (
                <div key={stage.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-edde-vivid" />
                      {stage.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 font-mono">
                        {stage.count.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-gray-400 w-10 text-right font-medium">
                        {pctOfFirst}%
                      </span>
                    </div>
                  </div>

                  {/* Custom CSS Bar */}
                  <div className="w-full bg-gray-100 rounded-lg h-3.5 overflow-hidden p-0.5 flex">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full bg-gradient-to-r from-edde-purple via-edde-vivid to-purple-400 rounded-md transition-all duration-500 shadow-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* WebAR & Quiz Funnel Highlights */}
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/60">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                WebAR Engagement
              </span>
              <span className="text-base font-extrabold text-edde-purple mt-0.5 block">
                {landingViews > 0 ? Math.round((webarStarted / landingViews) * 100) : 0}%
              </span>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/60">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                Quiz Completion Rate
              </span>
              <span className="text-base font-extrabold text-edde-vivid mt-0.5 block">
                {quizStarted > 0 ? Math.round((quizCompleted / quizStarted) * 100) : 0}%
              </span>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/60 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">
                WebAR Fallbacks
              </span>
              <span className="text-base font-extrabold text-gray-700 mt-0.5 block">
                {webarFallback}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Key Demographics & Breakdowns */}
        <div className="space-y-6">
          {/* Destination Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-edde-purple flex items-center gap-2">
                <Globe className="w-4 h-4 text-edde-vivid" />
                <span>Destination Preferences</span>
              </h3>
              <span className="text-[11px] text-gray-400">Top Choices</span>
            </div>

            {sortedDestinations.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No destination data yet</p>
            ) : (
              <div className="space-y-3">
                {sortedDestinations.slice(0, 5).map(([dest, count]) => (
                  <div key={dest} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{dest}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((count / (leads.length || 1)) * 100)
                            )}%`,
                          }}
                          className="h-full bg-edde-vivid rounded-full"
                        />
                      </div>
                      <span className="font-bold text-gray-900 w-6 text-right font-mono">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Study Levels Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-edde-purple flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-edde-vivid" />
                <span>Study Level Demographics</span>
              </h3>
            </div>

            {sortedStudyLevels.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No study level data yet</p>
            ) : (
              <div className="space-y-2.5">
                {sortedStudyLevels.map(([level, count]) => (
                  <div
                    key={level}
                    className="flex items-center justify-between text-xs p-2 bg-purple-50/40 rounded-xl border border-purple-50"
                  >
                    <span className="font-semibold text-gray-800">{level}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-edde-purple font-bold rounded-md font-mono">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Intended Intakes & Budget Categories */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-edde-purple flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-edde-vivid" />
                <span>Budget & Intake Insights</span>
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-2">
                  Target Intakes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(intakeMap).length === 0 ? (
                    <span className="text-gray-400">None recorded</span>
                  ) : (
                    Object.entries(intakeMap).map(([intake, cnt]) => (
                      <span
                        key={intake}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 font-medium rounded-lg"
                      >
                        {intake}: <strong className="text-edde-purple">{cnt}</strong>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-2">
                  Budget Tiers
                </span>
                <div className="space-y-1.5">
                  {Object.entries(budgetMap).length === 0 ? (
                    <span className="text-gray-400">Standard / Unspecified</span>
                  ) : (
                    Object.entries(budgetMap).map(([budget, cnt]) => (
                      <div key={budget} className="flex justify-between text-gray-700">
                        <span>{budget}</span>
                        <span className="font-bold text-edde-purple font-mono">{cnt}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
