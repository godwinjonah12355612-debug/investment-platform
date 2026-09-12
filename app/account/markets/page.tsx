"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Asset = {
  symbol: string;
  name: string;
  type: "Stock" | "ETF" | "Crypto" | "Index";
  price: string;
  change: string;
  changeValue: number;
};

const assets: Asset[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "Stock",
    price: "$227.16",
    change: "+1.42%",
    changeValue: 1.42,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "Stock",
    price: "$182.41",
    change: "+2.18%",
    changeValue: 2.18,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "Stock",
    price: "$505.78",
    change: "+0.86%",
    changeValue: 0.86,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    type: "Stock",
    price: "$231.42",
    change: "+1.15%",
    changeValue: 1.15,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    type: "Stock",
    price: "$341.08",
    change: "-0.42%",
    changeValue: -0.42,
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    type: "ETF",
    price: "$593.28",
    change: "+0.64%",
    changeValue: 0.64,
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    type: "ETF",
    price: "$573.81",
    change: "+0.91%",
    changeValue: 0.91,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "Crypto",
    price: "$108,420.00",
    change: "+1.81%",
    changeValue: 1.81,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    type: "Crypto",
    price: "$4,120.00",
    change: "+0.93%",
    changeValue: 0.93,
  },
  {
    symbol: "SOL",
    name: "Solana",
    type: "Crypto",
    price: "$214.72",
    change: "+3.24%",
    changeValue: 3.24,
  },
  {
    symbol: "SPX",
    name: "S&P 500",
    type: "Index",
    price: "5,612.24",
    change: "+0.64%",
    changeValue: 0.64,
  },
  {
    symbol: "NDX",
    name: "Nasdaq 100",
    type: "Index",
    price: "19,732.10",
    change: "+0.81%",
    changeValue: 0.81,
  },
];

const categories = ["All", "Stocks", "ETFs", "Crypto", "Indices"];

export default function MarketsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Popular");
const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
const [watchlistUpdating, setWatchlistUpdating] = useState<string | null>(null);

        useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
  const loadWatchlist = async () => {
    if (!user) return;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("watchlists")
      .select(`
        asset:assets (
          symbol
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Watchlist load error:", error);
      return;
    }

    const symbols = (data ?? [])
      .map((item: { asset: { symbol: string } | null }) => {
        const asset = item.asset as { symbol?: string } | null;
        return asset?.symbol ?? null;
      })
      .filter((symbol: string | null): symbol is string => Boolean(symbol));

    setWatchlistSymbols(symbols);
  };

  loadWatchlist();
}, [user]);
const toggleWatchlist = async (symbol: string) => {
  if (!user) return;

  setWatchlistUpdating(symbol);

  const supabase = createClient();

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .maybeSingle();

  if (assetError || !asset) {
    console.error("Asset lookup error:", assetError);
    setWatchlistUpdating(null);
    return;
  }

  const isWatching = watchlistSymbols.includes(symbol);

  if (isWatching) {
    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("asset_id", asset.id);

    if (error) {
      console.error("Remove watchlist error:", error);
      setWatchlistUpdating(null);
      return;
    }

    setWatchlistSymbols((current) =>
      current.filter((item) => item !== symbol)
    );
  } else {
    const { error } = await supabase
      .from("watchlists")
      .insert({
        user_id: user.id,
        asset_id: asset.id,
      });

    if (error) {
      console.error("Add watchlist error:", error);
      setWatchlistUpdating(null);
      return;
    }

    setWatchlistSymbols((current) => [...current, symbol]);
  }

  setWatchlistUpdating(null);
};

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (category !== "All") {
      const categoryMap: Record<string, Asset["type"]> = {
        Stocks: "Stock",
        ETFs: "ETF",
        Crypto: "Crypto",
        Indices: "Index",
      };

      result = result.filter(
        (asset) => asset.type === categoryMap[category]
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query)
      );
    }

    if (sort === "Top gainers") {
      result.sort((a, b) => b.changeValue - a.changeValue);
    }

    if (sort === "Top losers") {
      result.sort((a, b) => a.changeValue - b.changeValue);
    }

    return result;
  }, [category, search, sort]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading markets...
        </p>
      </main>
    );
  }
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
                Markets
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/account/watchlist")}
              className="hidden rounded-xl border border-[#dfe5df] bg-white px-4 py-2.5 text-xs font-semibold text-[#58635b] transition hover:bg-[#fbfcfa] sm:block"
            >
              Watchlist
            </button>

            <button
              onClick={() => router.push("/account/trade")}
              className="rounded-xl bg-[#111613] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1b241f]"
            >
              Trade
            </button>

            <button
              onClick={() => router.push("/account/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
              title={user?.email ?? "Account"}
            >
              {(
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">
        {/* INTRO */}
        <div>
          <p className="text-sm text-[#7b857e]">
            Explore markets and discover investment opportunities.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Market overview
          </h2>
        </div>

        {/* MARKET SNAPSHOT */}
        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MarketIndexCard
            symbol="S&P 500"
            value="5,612.24"
            change="+0.64%"
          />

          <MarketIndexCard
            symbol="NASDAQ"
            value="19,732.10"
            change="+0.81%"
          />

          <MarketIndexCard
            symbol="BTC"
            value="$108,420"
            change="+1.81%"
          />

          <MarketIndexCard
            symbol="ETH"
            value="$4,120"
            change="+0.93%"
          />
        </section>

        {/* SEARCH + FILTERS */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa39d]">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stocks, ETFs, crypto..."
                className="h-12 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] pl-11 pr-4 text-xs outline-none transition placeholder:text-[#a0a8a2] focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-medium text-[#58635b] outline-none"
              >
                <option>Popular</option>
                <option>Top gainers</option>
                <option>Top losers</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-semibold transition ${
                  category === item
                    ? "bg-[#111613] text-white"
                    : "border border-[#e1e5df] bg-white text-[#717b74] hover:bg-[#f5f7f3]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* TOP MOVERS */}
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <MoverCard
            title="Top gainers"
            items={[
              ["SOL", "Solana", "$214.72", "+3.24%"],
              ["NVDA", "NVIDIA", "$182.41", "+2.18%"],
              ["BTC", "Bitcoin", "$108,420", "+1.81%"],
            ]}
          />

          <MoverCard
            title="Popular today"
            items={[
              ["AAPL", "Apple", "$227.16", "+1.42%"],
              ["MSFT", "Microsoft", "$505.78", "+0.86%"],
              ["VOO", "Vanguard S&P 500", "$593.28", "+0.64%"],
            ]}
          />
        </section>

        {/* ASSET TABLE */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Discover investments
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                All assets
              </h3>
            </div>

            <span className="text-[10px] text-[#929b95]">
              {filteredAssets.length} assets
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">
                  <th className="pb-3 font-semibold">Asset</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Price</th>
                 <th className="pb-3 font-semibold">24h change</th>
<th className="pb-3 text-center font-semibold">
  Watchlist
</th>
<th className="pb-3 text-right font-semibold">
  Action
</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.symbol}
                    className="border-b border-[#f0f2ef] last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
                          {asset.symbol.slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-xs font-semibold">
                            {asset.symbol}
                          </p>

                          <p className="max-w-[220px] truncate text-[9px] text-[#929b95]">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="rounded-md bg-[#f4f6f3] px-2 py-1 text-[9px] font-medium text-[#727c75]">
                        {asset.type}
                      </span>
                    </td>

                    <td className="py-4 text-xs font-semibold">
                      {asset.price}
                    </td>

                    <td
                      className={`py-4 text-xs font-semibold ${
                        asset.changeValue >= 0
                          ? "text-[#16805a]"
                          : "text-[#c65b5b]"
                      }`}
                    >
                      {asset.change}
                    </td>

                    <td className="py-4 text-center">
  <button
    onClick={() => toggleWatchlist(asset.symbol)}
    disabled={watchlistUpdating === asset.symbol}
    className={`rounded-lg px-3 py-2 text-[9px] font-semibold transition disabled:opacity-50 ${
      watchlistSymbols.includes(asset.symbol)
        ? "bg-[#eaf6ef] text-[#16805a]"
        : "border border-[#dfe5df] bg-white text-[#68736b] hover:bg-[#f5f7f3]"
    }`}
  >
    {watchlistUpdating === asset.symbol
      ? "Saving..."
      : watchlistSymbols.includes(asset.symbol)
        ? "★ Saved"
        : "☆ Watch"}
  </button>
</td>

<td className="py-4 text-right">
  <button
    onClick={() => {
      if (asset.type === "Crypto") {
        router.push("/account/crypto");
        return;
      }

      router.push(`/account/trade?symbol=${asset.symbol}`);
    }}
    className="rounded-lg bg-[#111613] px-3 py-2 text-[9px] font-semibold text-white transition hover:bg-[#1b241f]"
  >
    Trade
  </button>
</td>
                  </tr>
                ))}

                {filteredAssets.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-sm text-[#8b948e]"
                    >
                      No assets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* INFO CARDS */}
        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <InfoCard
            title="Stocks"
            description="Explore individual companies and market leaders."
            onClick={() => setCategory("Stocks")}
          />

          <InfoCard
            title="ETFs"
            description="Browse diversified funds and market indexes."
            onClick={() => setCategory("ETFs")}
          />

          <InfoCard
  title="Crypto"
  description="Explore digital assets and supported markets."
  onClick={() => router.push("/account/crypto")}
/>
        </section>
      </section>
    </main>
  );
}

/* -------------------------------- */
/* COMPONENTS */
/* -------------------------------- */

function MarketIndexCard({
  symbol,
  value,
  change,
}: {
  symbol: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,25,0.03)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8f9992]">
          {symbol}
        </span>

        <span className="h-2 w-2 rounded-full bg-[#16805a]" />
      </div>

      <p className="mt-4 text-xl font-semibold tracking-[-0.03em]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-[#16805a]">
        {change}
      </p>
    </div>
  );
}

function MoverCard({
  title,
  items,
}: {
  title: string;
  items: string[][];
}) {
  return (
    <div className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="mt-4 space-y-2">
        {items.map(([symbol, name, price, change]) => (
          <div
            key={symbol}
            className="flex items-center justify-between rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ed] text-[10px] font-bold text-[#16805a]">
                {symbol.slice(0, 2)}
              </div>

              <div>
                <p className="text-xs font-semibold">{symbol}</p>
                <p className="text-[9px] text-[#929b95]">{name}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold">{price}</p>
              <p className="text-[9px] font-semibold text-[#16805a]">
                {change}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-[#dfe5df] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <p className="text-sm font-semibold">{title}</p>

      <p className="mt-2 text-[10px] leading-5 text-[#7f8982]">
        {description}
      </p>

      <span className="mt-4 inline-flex text-[10px] font-semibold text-[#16805a]">
        Explore →
      </span>
    </button>
  );
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

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}