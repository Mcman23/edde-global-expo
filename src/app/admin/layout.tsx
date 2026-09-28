import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createAuthClient } from "@/lib/supabase-auth";
import { createServiceClient } from "@/lib/supabase-admin";
import { SignOutButton } from "./signout-button";
import { LayoutDashboard, Users, Gift, BarChart3, Shield } from "lucide-react";

export const revalidate = 0; // Dynamic server layout

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname =
    headersList.get("x-pathname") ||
    headersList.get("next-url") ||
    headersList.get("x-invoke-path") ||
    "";

  const isLoginPage = pathname.includes("/admin/login");

  let user = null;
  let isAdmin = false;

  try {
    const supabaseAuth = createAuthClient();
    const {
      data: { user: currentUser },
    } = await supabaseAuth.auth.getUser();

    user = currentUser;

    if (user) {
      // Verify authorization against `admin_users` table
      const supabaseAdmin = createServiceClient();
      const { data: adminRecord } = await supabaseAdmin
        .from("admin_users")
        .select("id, email")
        .eq("id", user.id)
        .maybeSingle();

      isAdmin = !!adminRecord;
    }
  } catch (err) {
    console.error("Admin layout auth check exception:", err);
  }

  // If on login page
  if (isLoginPage) {
    // If user is already authenticated and verified admin, redirect away from login to dashboard
    if (user && isAdmin) {
      redirect("/admin");
    }
    // Otherwise render login page without the full admin navigation bar
    return <>{children}</>;
  }

  // If not authenticated or not listed in admin_users, redirect to login
  if (!user || !isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-edde-light font-sans text-gray-800 flex flex-col">
      {/* Top Bar Navigation */}
      <header className="bg-white border-b border-purple-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 group transition-transform active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-edde-purple to-edde-vivid flex items-center justify-center text-white shadow-sm group-hover:shadow-glow transition-all">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M5 6l3 3 4-4 4 4 3-3v3H5V6z" fill="#ffde00" stroke="#ffde00" />
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-edde-purple tracking-tight">
                    EDDE Global
                  </span>
                  <span className="text-[10px] font-bold text-edde-vivid uppercase tracking-wider -mt-1">
                    Expo Admin
                  </span>
                </div>
              </Link>

              {/* Security Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-edde-purple text-[11px] font-semibold rounded-full border border-purple-100 ml-2">
                <Shield className="w-3 h-3 text-edde-vivid" />
                <span>Protected Access</span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-edde-purple hover:bg-purple-50 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-edde-vivid" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                href="/admin/leads"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-edde-purple hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4 text-edde-vivid" />
                <span className="hidden sm:inline">Leads</span>
              </Link>

              <Link
                href="/admin/offers"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-edde-purple hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Gift className="w-4 h-4 text-edde-vivid" />
                <span className="hidden sm:inline">Offers</span>
              </Link>

              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-edde-purple hover:bg-purple-50 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-edde-vivid" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
            </nav>

            {/* Right Side: User Email + Sign Out */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-gray-800">
                  {user.email}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Administrator
                </span>
              </div>

              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} EDDE Global Expo Operations
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Next.js 14 App Router</span>
            <span>•</span>
            <span>Supabase RLS Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
