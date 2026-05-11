import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoginSubmitButton } from "@/components/login/LoginSubmitButton";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LoginPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error as string | undefined;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#ecf1f6] p-4 md:p-8 relative overflow-hidden">
      {/* Soft glowing background blur effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#dbeafe] via-[#ecf1f6] to-[#dbeafe] blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-50 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(147, 197, 253, 0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Main Card Container (Split Screen) */}
      <div className="w-full max-w-[1000px] bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row min-h-[600px] z-10 border border-white/50 transition-all animate-in zoom-in-95 duration-500">
        
        {/* Left Side: Form Content */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-center bg-[#F8F9FB]">
          <div className="w-full max-w-sm flex flex-col">
            
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#2563eb] text-xs font-bold transition-colors mb-6 self-start">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </Link>

            <div className="text-center space-y-2 mb-10">
              <h1 className="text-3xl font-bold text-[#1f2937] tracking-tight">Halo, Sahabat!</h1>
              <p className="text-slate-500 text-[0.925rem]">Masuk untuk mengakses Dashboard Ujian</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-6 flex items-center">
                {error}
              </div>
            )}

            <form action={login} className="space-y-5 w-full">
              
              {/* Email Input with Icon */}
              <div className="space-y-1.5 relative">
                <div className="absolute left-3.5 top-[38px] text-slate-400 pointer-events-none">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Alamat Email"
                  required
                  className="h-[52px] pl-11 bg-[#edf2f7] border-none rounded-xl text-slate-700 placeholder:text-slate-400 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                />
              </div>

              {/* Password Input with Icons */}
              <div className="space-y-1.5 relative">
                <div className="absolute left-3.5 top-[38px] text-slate-400 pointer-events-none">
                  <Lock className="h-[18px] w-[18px]" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Kata Sandi"
                  required
                  className="h-[52px] pl-11 bg-[#edf2f7] border-none rounded-xl text-slate-700 placeholder:text-slate-400 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                />
                <button type="button" className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600">
                  <Eye className="h-[18px] w-[18px]" />
                </button>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-sm pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="rounded border-slate-300 text-primary data-[state=checked]:bg-primary" />
                  <label htmlFor="remember" className="text-slate-600 text-xs font-medium cursor-pointer">
                    Ingat Saya
                  </label>
                </div>
                <a href="#" className="text-xs text-[#2563eb] font-semibold hover:underline">
                  Lupa Password?
                </a>
              </div>

              <LoginSubmitButton />

              {/* Divider */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400">Atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Bottom link */}
              <div className="text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Belum punya akun? <a href="#" className="text-[#2563eb] hover:underline font-bold">Hubungi Administrator</a>
                </p>
              </div>
            </form>

          </div>
        </div>

        {/* Right Side: The Illustration Pane */}
        <div className="hidden md:block w-1/2 relative overflow-hidden bg-gradient-to-b from-teal-800/90 to-[#0F2E38]">
          <Image
            src="/login-illustration.png"
            alt="Dashboard Illustration"
            fill
            className="object-cover object-center opacity-90"
            priority
          />
          {/* Overlay effect matching screen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F2E38]/80 via-transparent to-transparent mix-blend-multiply" />
        </div>

      </div>
    </div>
  );
}
