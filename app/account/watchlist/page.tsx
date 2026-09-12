"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type WatchlistItem = {
  id: string;
  asset_id: string;
  asset: {
    symbol: string;
    name: string;
    asset_type: "stock" | "etf" | "crypto" | "index";
    current_price: number | null;
    price_change_24h: number | null;
  } | null;
};

export default function WatchlistPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadWatchlist = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("watchlists")
        .select(
          `
            id,
            asset_id,
            asset:assets(
              symbol,
              name,
              asset_type,
              current_price,
              price_change_24h
            )
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Watchlist error:", error);
        setWatchlist([]);
      } else {
        setWatchlist((data ?? []) as WatchlistItem[]);
      }

      setLoading(false);
    };

    loadWatchlist();
  }, [router]);

  const removeFromWatchlist = async (watchlistId: string) => {
    setRemovingId(watchlistId);

    const supabase = createClient();

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", watchlistId);

    if (error) {
      console.error("Remove watchlist error:", error);
      setRemovingId(null);
      return;
    }

    setWatchlist((current) =>
      current.filter((item) => item.id !== watchlistId)
    );

    setRemovingId(null);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading watchlist...
        </p>
      </main>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/account")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] transition hover:text-[#111613]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Watchlist
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push("/account/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
            title={user?.email ?? "Account"}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1200px] px-5 py-8 sm:px-7 lg:px-9">
        <div>
          <p className="text-sm text-[#7b857e]">
            Keep track of investments you are interested in.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            My watchlist
          </h2>
        </div>

        {watchlist.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-10 text-center shadow-[0_12px_35px_rgba(20,35,25,0.04)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#16805a]">
              <StarIcon />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Your watchlist is empty
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#7b857e]">
              Add stocks, ETFs, or crypto assets from the Markets page and
              they will appear here.
            </p>

            <button
              onClick={() => router.push("/account/markets")}
              className="mt-6 rounded-xl bg-[#111613] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#1b241f]"
            >
              Explore markets
            </button>
          </section>
        ) : (
          <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#89928b]">
                  Saved investments
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Your watchlist
                </h3>
              </div>

              <span className="text-[10px] text-[#929b95]">
                {watchlist.length}{" "}
                {watchlist.length === 1 ? "asset" : "assets"}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {watchlist.map((item) => {
                if (!item.asset) return null;

                const isCrypto = item.asset.asset_type === "crypto";
                const change = Number(
                  item.asset.price_change_24h ?? 0
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-xs font-bold text-[#16805a]">
                        {item.asset.symbol.slice(0, 2)}
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {item.asset.symbol}
                        </p>

                        <p className="text-[10px] text-[#929b95]">
                          {item.asset.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            Number(item.asset.current_price ?? 0)
                          )}
                        </p>

                        <p
                          className={`text-[10px] font-semibold ${
                            change >= 0
                              ? "text-[#16805a]"
                              : "text-[#c65b5b]"
                          }`}
                        >
                          {change >= 0 ? "+" : ""}
                          {change.toFixed(2)}%
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (isCrypto) {
                            router.push("/account/crypto");
                          } else {
                            router.push(
                              `/account/trade?symbol=${item.asset?.symbol}`
                            );
                          }
                        }}
                        className="rounded-lg bg-[#111613] px-4 py-2.5 text-[9px] font-semibold text-white transition hover:bg-[#1b241f]"
                      >
                        Trade
                      </button>

                      <button
                        onClick={() =>
                          removeFromWatchlist(item.id)
                        }
                        disabled={removingId === item.id}
                        className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2.5 text-[9px] font-semibold text-[#68736b] transition hover:bg-[#f5f7f3] disabled:opacity-50"
                      >
                        {removingId === item.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}