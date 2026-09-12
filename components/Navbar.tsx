
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      console.log("Auth event:", event);
      console.log("User:", session?.user?.email ?? "No user");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();

    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  };

  return (
    <nav className="border-b border-[#e1e5df] bg-[#f7f8f5]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-sm font-bold text-white">
            IP
          </div>

          <div>
            <div className="text-sm font-semibold text-[#111613]">
              Investment Platform
            </div>

            <div className="text-xs text-gray-500">
              Modern investing education
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/markets"
            className="text-sm text-[#111613] transition hover:text-[#16805a]"
          >
            Markets
          </Link>

          <Link
            href="/platform"
            className="text-sm text-[#111613] transition hover:text-[#16805a]"
          >
            Platform
          </Link>

          <Link
            href="/security"
            className="text-sm text-[#111613] transition hover:text-[#16805a]"
          >
            Security
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
          ) : user ? (
            <>
              <span className="hidden max-w-[220px] truncate text-sm text-[#111613] sm:block">
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-[#d7ddd6] px-4 py-2 text-sm font-medium text-[#111613] transition hover:bg-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#111613] transition hover:bg-white sm:block"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-[#111613] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}