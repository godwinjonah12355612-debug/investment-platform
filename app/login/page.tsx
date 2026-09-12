"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  console.log("HANDLE SUBMIT FIRED");
  setLoading(true);
  setErrorMessage("");

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

console.log("LOGIN RESULT:", {
  error,
  user: data.user?.email ?? null,
  hasSession: !!data.session,
});

if (error) {
  setErrorMessage(error.message);
  setLoading(false);
  return;
}

if (!data.session) {
  setErrorMessage(
    "Login completed, but no active session was created. Please try again."
  );
  setLoading(false);
  return;
}
console.log("LOGIN SUCCESS:", data.session.user.email);

window.location.href = "/account";
};

return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8f5] text-[#111613]">

      {/* DEMO NOTICE */}
      <div className="border-b border-[#e1e5df] bg-[#eef3ed] px-4 py-2 text-center text-[10px] font-medium tracking-[0.08em] text-[#667169] sm:text-[11px]">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#16805a]" />
        DEMO • EDUCATIONAL SIMULATION
        <span className="mx-2 text-[#a3aca5]">•</span>
        No real funds or securities are involved.
      </div>

      {/* HEADER */}
      <header className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="flex h-[80px] items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-black text-white">
              IP
            </div>

            <div>
              <div className="text-sm font-bold tracking-[-0.02em] sm:text-[15px]">
                Investment Platform
              </div>

              <div className="hidden text-[9px] uppercase tracking-[0.18em] text-[#89928b] sm:block">
                Modern investing education
              </div>
            </div>
          </Link>

          {/* BACK TO HOME */}
          <Link
            href="/"
            className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#4e5851] transition hover:bg-white"
          >
            Back to home
          </Link>
        </div>
      </header>

      {/* LOGIN SECTION */}
      <section className="relative mx-auto flex min-h-[calc(100vh-160px)] max-w-[1440px] items-center justify-center px-5 py-12 sm:px-8 lg:px-12">

        {/* BACKGROUND EFFECT */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b9dfc9]/25 blur-[130px]" />

        <div className="relative w-full max-w-[430px]">

          {/* LOGIN CARD */}
          <div className="rounded-[30px] border border-[#dfe5df] bg-white p-6 shadow-[0_30px_80px_rgba(24,38,29,0.10)] sm:p-8">

            {/* CARD INTRO */}
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f4eb] text-xs font-black text-[#16805a]">
                IP
              </div>

              <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.05em] sm:text-[36px]">
                Welcome back.
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#68736b]">
                Sign in to continue exploring your simulated investment
                environment.
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* FORM */}
               
               <form
  
  onSubmit={(e) => {
    e.preventDefault();
    handleSubmit(e);
  }}
  className="space-y-5"
>
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[12px] font-semibold text-[#3f4942]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 text-sm text-[#111613] outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-semibold text-[#3f4942]"
                  >
                    Password
                  </label>

                  <Link
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-[12px] font-medium text-[#16805a] transition hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 pr-16 text-sm text-[#111613] outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
                  />

                  <button
                    type="button"

                    onPointerDown={(e) => {
  e.preventDefault();
  setShowPassword((current) => !current);
}}
            

                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#68736b] transition hover:bg-[#eef3ed] hover:text-[#111613]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd3cd] accent-[#16805a]"
                />

                <span className="text-[12px] text-[#68736b]">
                  Remember me
                </span>
              </label>

              {/* LOGIN BUTTON */}
              <button
  type="submit"
  disabled={loading}
  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#111613] px-6 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#1b241f] disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "Logging in..." : "Log in"}
</button>
            </form>

            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#edf0ed]" />

              <span className="text-[10px] uppercase tracking-[0.12em] text-[#9aa39d]">
                Or
              </span>

              <div className="h-px flex-1 bg-[#edf0ed]" />
            </div>

            {/* GOOGLE */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#dfe5df] bg-white text-sm font-semibold text-[#222b25] transition hover:border-[#c6cec8] hover:bg-[#fbfcfa]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#e1e5df] text-[11px] font-bold">
                G
              </span>

              Continue with Google
            </button>

            {/* SIGN UP */}
            <p className="mt-7 text-center text-[12px] text-[#737d76]">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#16805a] hover:underline"
              >
                Get started
              </Link>
            </p>
          </div>

          {/* EDUCATIONAL NOTICE */}
          <div className="mt-5 rounded-2xl border border-[#dce4dd] bg-[#eef3ed] p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e2f1e8] text-[#16805a]">
                <CheckIcon />
              </span>

              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5d6961]">
                Educational simulation
              </span>
            </div>

            <p className="mt-2 text-[10px] leading-5 text-[#7a847d]">
              This platform is for educational purposes only.
              No real funds or securities are involved.
            </p>
          </div>

          {/* FOOTER TEXT */}
          <p className="mt-6 text-center text-[9px] uppercase tracking-[0.1em] text-[#9aa29c]">
            Investment Platform • Modern investing education
          </p>
        </div>
      </section>
    </main>
  );
}

/* ----------------------------- */
/* CHECK ICON */
/* ----------------------------- */
function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}