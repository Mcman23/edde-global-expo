import { createServiceClient } from "@/lib/supabase-admin";
import { OfferForm, Offer } from "./offer-form";
import { Gift, Plus, Calendar, Tag, CheckCircle2, XCircle, Edit3 } from "lucide-react";

export const revalidate = 0; // Dynamic server page

export default async function AdminOffersPage() {
  const supabase = createServiceClient();

  const { data: offersData, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching offers:", error);
  }

  const offers: Offer[] = offersData || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-edde-purple font-poppins">
              Expo Benefits & Offers
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-edde-purple rounded-full">
              {offers.length} Configured
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure premium scholarship assessment packages, application fee waivers, and exclusive consultation offers editable live without code changes.
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Top/Side & Offers List */}
      <div className="space-y-6">
        {/* Offer Form Component */}
        <OfferForm />

        {/* Existing Offers Roster */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-edde-purple font-poppins flex items-center gap-2">
            <Gift className="w-5 h-5 text-edde-vivid" />
            <span>Active & Inactive Expo Offers</span>
          </h2>

          {offers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-purple-100 shadow-card text-center">
              <Gift className="w-12 h-12 text-edde-vivid mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-gray-900">No offers created yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Fill in the form above to add an expo benefit such as &quot;EDDE Expo 2026 Free Application Fee Waiver&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white p-6 rounded-3xl border border-purple-100 shadow-card flex flex-col justify-between hover:border-purple-200 transition-all group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          offer.active
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {offer.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active Live</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-gray-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>

                      {offer.campaign && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-edde-purple font-semibold text-[11px] rounded-full border border-purple-100">
                          <Tag className="w-3 h-3 text-edde-vivid" />
                          <span>{offer.campaign}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-extrabold text-edde-purple font-poppins mb-2">
                      {offer.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                      {offer.description}
                    </p>
                  </div>

                  {/* Footer details & CTA Preview */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="font-semibold text-edde-vivid bg-purple-50 px-2.5 py-1 rounded-lg">
                        Button: &quot;{offer.cta_text}&quot;
                      </span>

                      {offer.expires_at && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>Exp: {new Date(offer.expires_at).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
