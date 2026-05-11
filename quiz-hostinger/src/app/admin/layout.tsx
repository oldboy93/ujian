import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { LogOut, User, Calendar } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('id-ID', options);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">

      {/* Exact Match Header: .homepage-header-modern from source */}
      <header className="w-full sticky top-0 z-50 flex justify-between items-center px-8 py-3 bg-white/90 backdrop-blur-[12px] border-b border-black/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

        {/* .header-left */}
        <div className="flex items-center gap-4">
          {/* .logo-wrapper */}
          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-[0_4px_10px_rgba(62,183,179,0.15)] border overflow-hidden">
            <span className="text-[#3eb7b3] font-extrabold text-lg">U</span>
          </div>
          {/* .brand-info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-[1.25rem] font-extrabold tracking-[-0.5px] text-[#1e293b] leading-[1.2]">.Ujian</h1>
            {/* .date-badge */}
            <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-[#64748b] mt-0.5">
              <Calendar className="h-3 w-3 text-[#3eb7b3]" />
              {formattedDate}
            </div>
          </div>s
        </div>

        {/* .header-right */}
        <div className="flex items-center gap-4">
          {/* .user-profile-box */}
          <div className="flex items-center gap-3 pr-3 border-r border-[#e2e8f0]">
            <div className="hidden md:block text-right">
              <p className="text-[1rem] font-bold text-[#334155] leading-none">{user?.email?.split('@')[0].toUpperCase()}</p>
            </div>
            {/* .user-avatar-frame */}
            <div className="h-[42px] w-[42px] bg-[#e2e8f0] rounded-full flex items-center justify-center border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden">
              <User className="h-5 w-5 text-[#94a3b8]" />
            </div>
          </div>

          {/* .logout-btn-modern */}
          <form action={logout}>
            <button type="submit" className="w-10 h-10 rounded-[10px] bg-transparent text-[#ef4444] border border-transparent hover:bg-[#fef2f2] hover:border-[#fee2e2] flex items-center justify-center cursor-pointer transition-all duration-200 hover:translate-x-[2px]">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* .homepage-main: Exact Gradient Transition from CSS source */}
      <main className="flex-1 relative z-10 w-full bg-[linear-gradient(180deg,#e7f6fb_0%,#ffffff_100%)] min-h-screen overflow-visible">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 pb-24">
          {children}
        </div>
      </main>

      {/* .homepage-footer from source */}
      <footer className="w-full bg-[#3eb7b3] text-white text-center py-4 text-[0.9rem] tracking-[0.5px] z-50">
        © {new Date().getFullYear()} Rumah Sakit Annisa — Mendampingi Sedekat Sahabat
      </footer>
    </div>
  );
}
