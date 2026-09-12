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
}