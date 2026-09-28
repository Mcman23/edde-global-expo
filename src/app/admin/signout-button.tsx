"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-edde-purple bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 disabled:opacity-50"
      title="Sign out of EDDE Expo Admin"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-edde-purple" />
      ) : (
        <LogOut className="w-3.5 h-3.5 text-edde-purple" />
      )}
      <span>Sign out</span>
    </button>
  );
}
