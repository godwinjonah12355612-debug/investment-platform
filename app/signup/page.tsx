"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!agree) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
if (error) {
  console.error("Signup error:", error);
  setError(error.message);
  setLoading(false);
  return;
}

    setMessage(
      "Account created successfully. Please check your email to confirm your account."
    );

    setLoading(false);

    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#111613]">
     

      {/* Header */}
      <header className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-sm font-bold text-white">
            IP
          </div>

          <div>
            <div className="text-sm font-semibold tracking-tight">
              Investment Platform
            </div>
            <div className="text-xs text-[#68736b]">
              Modern investing education
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-[#68736b] transition hover:text-[#111613]"
        >
          Back to home
        </Link>
      </header>

      {/* Signup */}
      <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#e1e5df] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#68736b]">
                Start exploring the Investment Platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full rounded-xl border border-[#dce1db] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-2 focus:ring-[#16805a]/10"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-[#dce1db] bg-[#fbfcfa] px-4 py-3 text-sm outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-2 focus:ring-[#16805a]/10"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="w-full rounded-xl border border-[#dce1db] bg-[#fbfcfa] px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-2 focus:ring-[#16805a]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#68736b] hover:text-[#111613]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full rounded-xl border border-[#dce1db] bg-[#fbfcfa] px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-[#9aa39d] focus:border-[#16805a] focus:ring-2 focus:ring-[#16805a]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#68736b] hover:text-[#111613]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 text-sm text-[#68736b]">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#16805a]"
                />

                <span className="leading-6">
                  I agree to the{" "}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium text-[#16805a] hover:underline"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium text-[#16805a] hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="rounded-xl border border-[#b9dfce] bg-[#eef8f3] px-4 py-3 text-sm text-[#126b4b]">
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!agree || loading}
                className="w-full rounded-xl bg-[#111613] px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              {/* Google Placeholder */}
              <button
                type="button"
                disabled
                className="w-full rounded-xl border border-[#dce1db] bg-white px-5 py-3.5 text-sm font-semibold text-[#68736b] opacity-70"
              >
                Continue with Google
              </button>
            </form>

            <div className="mt-7 text-center text-sm text-[#68736b]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#16805a] hover:underline"
              >
                Log in
              </Link>
            </div>
          </div>

          
        </div>
      </section>
    </main>
  );
}