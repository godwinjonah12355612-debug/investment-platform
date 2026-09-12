"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

type Position = {
  id: string;
  quantity: number;
  average_cost: number;
  asset:
    | {
        symbol: string;
        name: string;
        asset_type: string;
        current_price: number | null;
        price_change_24h: number | null;
      }
    | null;
};

type CashBalance = {
  currency: string;
  available_balance: number;
};

type Snapshot = {
  id: string;
  portfolio_value: number;
  cash_value: number;
  invested_value: number;
  created_at: string;
};

type Activity = {
  id: string;
  transaction_type: string;
  status: string;
  asset_id: string | null;
  currency: string | null;
  amount: number | null;
  fee: number | null;
  reference: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

type MarketAsset = {
  symbol: string;
  name: string;
  asset_type: string;
  current_price: number | null;
  price_change_24h: number | null;
};

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalances, setCashBalances] = useState<CashBalance[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState("1M");

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    const loadAccount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);

      const [
        positionsResult,
        cashResult,
        snapshotsResult,
        activitiesResult,
        assetsResult,
      ] = await Promise.all([
        supabase
          .from("positions")
          .select(`
            id,
            quantity,
            average_cost,
            asset:assets(
              symbol,
              name,
              asset_type,
              current_price,
              price_change_24h
            )
          `)
          .eq("user_id", session.user.id),

        supabase
          .from("cash_balances")
          .select("currency, available_balance")
          .eq("user_id", session.user.id),

        supabase
          .from("portfolio_snapshots")
          .select(
            "id, portfolio_value, cash_value, invested_value, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true }),

        supabase
          .from("transactions")
          .select(
            "id, transaction_type, status, asset_id, currency, amount, fee, reference, description, metadata, created_at"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(6),

        supabase
          .from("assets")
          .select(
            "symbol, name, asset_type, current_price, price_change_24h"
          )
          .in("symbol", ["AAPL", "BTC", "ETH", "TSLA"]),
      ]);

      if (positionsResult.error) {
        console.error(
          "Overview positions error:",
          positionsResult.error
        );
      }

      if (cashResult.error) {
        console.error(
          "Overview cash error:",
          cashResult.error
        );
      }

      if (snapshotsResult.error) {
        console.error(
          "Overview snapshots error:",
          snapshotsResult.error
        );
      }

      if (activitiesResult.error) {
        console.error(
          "Overview activity error:",
          activitiesResult.error
        );
      }

      if (assetsResult.error) {
        console.error(
          "Overview market assets error:",
          assetsResult.error
        );
      }

      if (!mounted) return;

      setPositions((positionsResult.data ?? []) as Position[]);
      setCashBalances(cashResult.data ?? []);
      setSnapshots(
        (snapshotsResult.data ?? []) as Snapshot[]
      );
      setActivities(
        (activitiesResult.data ?? []) as Activity[]
      );
      setMarketAssets(
        (assetsResult.data ?? []) as MarketAsset[]
      );

      setLoading(false);
    };

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [router]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  const portfolio = useMemo(() => {
    let investedValue = 0;
    let positionsValue = 0;

    const holdings = positions
      .filter((position) => position.asset)
      .map((position) => {
        const quantity = Number(position.quantity ?? 0);
        const averageCost = Number(
          position.average_cost ?? 0
        );
        const currentPrice = Number(
          position.asset?.current_price ?? averageCost
        );

        const costBasis = quantity * averageCost;
        const currentValue = quantity * currentPrice;
        const profitLoss = currentValue - costBasis;

        investedValue += costBasis;
        positionsValue += currentValue;

        return {
          ...position,
          quantity,
          averageCost,
          currentPrice,
          costBasis,
          currentValue,
          profitLoss,
          returnPercent:
            costBasis > 0
              ? (profitLoss / costBasis) * 100
              : 0,
        };
      });

    const usdCash =
      Number(
        cashBalances.find(
          (item) => item.currency === "USD"
        )?.available_balance ?? 0
      );

    const eurCash =
      Number(
        cashBalances.find(
          (item) => item.currency === "EUR"
        )?.available_balance ?? 0
      );

    const eurToUsdRate = 1.0827;

    const eurUsdValue = eurCash * eurToUsdRate;

    const totalCashUsd = usdCash + eurUsdValue;

    const totalPortfolioValue =
      positionsValue + totalCashUsd;

    const totalReturn =
      positionsValue - investedValue;

    const totalReturnPercent =
      investedValue > 0
        ? (totalReturn / investedValue) * 100
        : 0;

    return {
      holdings,
      investedValue,
      positionsValue,
      usdCash,
      eurCash,
      eurUsdValue,
      totalCashUsd,
      totalPortfolioValue,
      totalReturn,
      totalReturnPercent,
    };
  }, [positions, cashBalances]);

  const todayPerformance = useMemo(() => {
  if (snapshots.length === 0) {
    return {
      value: 0,
      percent: 0,
    };
  }

  const currentValue = portfolio.totalPortfolioValue;

  // Use the first snapshot recorded today as today's starting value.
  const now = new Date();

  const todaySnapshots = snapshots.filter(
    (snapshot) => {
      const snapshotDate = new Date(
        snapshot.created_at
      );

      return (
        snapshotDate.getFullYear() ===
          now.getFullYear() &&
        snapshotDate.getMonth() ===
          now.getMonth() &&
        snapshotDate.getDate() ===
          now.getDate()
      );
    }
  );

  if (todaySnapshots.length === 0) {
    return {
      value: 0,
      percent: 0,
    };
  }

  const startingValue = Number(
    todaySnapshots[0].portfolio_value ?? 0
  );

  const value = currentValue - startingValue;

  const percent =
    startingValue > 0
      ? (value / startingValue) * 100
      : 0;

  return {
    value,
    percent,
  };
}, [snapshots, portfolio.totalPortfolioValue]);
  const chartSnapshots = useMemo(() => {
    if (snapshots.length === 0) {
      return [];
    }

    const values = snapshots.map((snapshot) =>
      Number(snapshot.portfolio_value ?? 0)
    );

    if (values.length === 1) {
      return [
        {
          ...snapshots[0],
          displayValue: values[0],
        },
        {
          ...snapshots[0],
          id: `${snapshots[0].id}-current`,
          displayValue: portfolio.totalPortfolioValue,
          created_at: new Date().toISOString(),
        },
      ];
    }

    return snapshots.map((snapshot, index) => ({
      ...snapshot,
      displayValue:
        index === snapshots.length - 1
          ? portfolio.totalPortfolioValue
          : Number(snapshot.portfolio_value ?? 0),
    }));
  }, [snapshots, portfolio.totalPortfolioValue]);

  const chartRange = useMemo(() => {
    if (chartSnapshots.length === 0) {
      return {
        min: 0,
        max: Math.max(portfolio.totalPortfolioValue, 1),
      };
    }

    const values = chartSnapshots.map(
      (item) => item.displayValue
    );

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [chartSnapshots, portfolio.totalPortfolioValue]);

  const chartPoints = useMemo(() => {
    if (chartSnapshots.length === 0) {
      return "";
    }

    const width = 1000;
    const height = 280;
    const paddingX = 35;
    const paddingY = 25;

    const range =
      chartRange.max - chartRange.min || 1;

    return chartSnapshots
      .map((snapshot, index) => {
        const x =
          chartSnapshots.length === 1
            ? width / 2
            : paddingX +
              (index /
                (chartSnapshots.length - 1)) *
                (width - paddingX * 2);

        const normalized =
          (snapshot.displayValue - chartRange.min) /
          range;

        const y =
          height -
          paddingY -
          normalized *
            (height - paddingY * 2);

        return `${x},${y}`;
      })
      .join(" ");
  }, [chartSnapshots, chartRange]);

  const topHoldings = useMemo(() => {
    return [...portfolio.holdings]
      .sort(
        (a, b) =>
          b.currentValue - a.currentValue
      )
      .slice(0, 4);
  }, [portfolio.holdings]);

  const sortedMarketAssets = useMemo(() => {
    const preferredOrder = [
      "AAPL",
      "BTC",
      "ETH",
      "TSLA",
    ];

    return [...marketAssets].sort(
      (a, b) =>
        preferredOrder.indexOf(a.symbol) -
        preferredOrder.indexOf(b.symbol)
    );
  }, [marketAssets]);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <div className="text-sm text-[#68736b]">
          Loading account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      <div className="flex min-h-screen">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <button
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-[#dfe5df] bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          {/* LOGO */}
          <div className="flex h-[76px] items-center border-b border-[#edf0ed] px-5">
            <button
              onClick={() => {
                setSidebarOpen(false);
                router.push("/");
              }}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-black text-white">
                IP
              </div>

              <div>
                <div className="text-sm font-bold">
                  Investment Platform
                </div>

                <div className="text-[9px] uppercase tracking-[0.16em] text-[#909991]">
                  Wealth workspace
                </div>
              </div>
            </button>
          </div>

          {/* NAVIGATION */}
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Overview
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                icon={<GridIcon />}
                label="Overview"
                active
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account");
                }}
              />

              <NavItem
                icon={<PortfolioIcon />}
                label="Portfolio"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/portfolio");
                }}
              />

              <NavItem
                icon={<MarketIcon />}
                label="Markets"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/markets");
                }}
              />

              <NavItem
                icon={<TradeIcon />}
                label="Trade"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/trade");
                }}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Investing
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                icon={<CryptoIcon />}
                label="Crypto"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/crypto");
                }}
              />

              <NavItem
                icon={<ConvertIcon />}
                label="Convert"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/convert");
                }}
              />

              <NavItem
                icon={<StarIcon />}
                label="Watchlist"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/watchlist");
                }}
              />

              <NavItem
                icon={<OrdersIcon />}
                label="Orders"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push("/account/orders");
                }}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Activity
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                icon={<ReceiptIcon />}
                label="Transactions"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(
                    "/account/transactions"
                  );
                }}
              />

              <NavItem
                icon={<TransferIcon />}
                label="Transfers"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(
                    "/account/transfers"
                  );
                }}
              />

              <NavItem
                icon={<ChartIcon />}
                label="Analytics"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(
                    "/account/analytics"
                  );
                }}
              />

              <NavItem
                icon={<MessageIcon />}
                label="Support"
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(
                    "/account/support"
                  );
                }}
              />
            </nav>
          </div>

          {/* USER AREA */}
          <div className="border-t border-[#edf0ed] p-3">
            <button
              onClick={() =>
                router.push("/account/settings")
              }
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#f5f7f3]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcefe4] text-xs font-bold text-[#16805a]">
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {displayName}
                </p>

                <p className="truncate text-[9px] text-[#909991]">
                  {user?.email}
                </p>
              </div>

              <ChevronIcon />
            </button>

            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#69736c] transition hover:bg-[#f5f7f3] hover:text-[#111613]"
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="sticky top-0 z-20 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
            <div className="flex h-[76px] items-center justify-between px-5 sm:px-7 lg:px-9">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl border border-[#dfe5df] bg-white p-2.5 lg:hidden"
                  aria-label="Open navigation"
                >
                  <MenuIcon />
                </button>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                    Overview
                  </p>

                  <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Good morning, {displayName}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  aria-label="Search"
                  onClick={() =>
                    router.push("/account/markets")
                  }
                  className="hidden rounded-xl border border-[#dfe5df] bg-white p-2.5 text-[#657067] transition hover:bg-[#fbfcfa] sm:block"
                >
                  <SearchIcon />
                </button>

                <button
                  aria-label="Notifications"
                  onClick={() =>
                    router.push("/account/transactions")
                  }
                  className="rounded-xl border border-[#dfe5df] bg-white p-2.5 text-[#657067] transition hover:bg-[#fbfcfa]"
                >
                  <BellIcon />
                </button>

                <button
                  onClick={() =>
                    router.push("/account/settings")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
                >
                  {displayName
                    .charAt(0)
                    .toUpperCase()}
                </button>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">
            {/* INTRO */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-[#7b857e]">
                  Here's your account at a glance.
                </p>

                <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
                  Your financial overview
                </h2>
              </div>

              <button
                onClick={() =>
                  router.push("/account/portfolio")
                }
                className="w-fit rounded-xl bg-[#111613] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                View portfolio
              </button>
            </div>

            {/* METRICS */}
            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total portfolio"
                value={formatMoney(
                  portfolio.totalPortfolioValue
                )}
                change="Investments + cash"
                positive={false}
                icon={<WalletIcon />}
              />

              <MetricCard
                label="Available cash"
                value={formatMoney(
                  portfolio.totalCashUsd
                )}
                change="USD equivalent"
                positive={false}
                icon={<CashIcon />}
              />

              <MetricCard
                label="Today's P&L"
                value={`${
                  todayPerformance.value >= 0
                    ? "+"
                    : ""
                }${formatMoney(
                  todayPerformance.value
                )}`}
                change={`${
                  todayPerformance.percent >= 0
                    ? "+"
                    : ""
                }${todayPerformance.percent.toFixed(
                  2
                )}%`}
                positive={
                  todayPerformance.value >= 0
                }
                icon={<TrendIcon />}
              />

              <MetricCard
                label="Total return"
                value={`${
                  portfolio.totalReturn >= 0
                    ? "+"
                    : ""
                }${formatMoney(
                  portfolio.totalReturn
                )}`}
                change={`${
                  portfolio.totalReturnPercent >= 0
                    ? "+"
                    : ""
                }${portfolio.totalReturnPercent.toFixed(
                  2
                )}%`}
                positive={
                  portfolio.totalReturn >= 0
                }
                icon={<ReturnIcon />}
              />
            </section>

            {/* PERFORMANCE */}
            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs text-[#89928b]">
                    Portfolio performance
                  </p>

                  <div className="mt-1 flex items-end gap-3">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em]">
                      {formatMoney(
                        portfolio.totalPortfolioValue
                      )}
                    </h3>

                    <span
                      className={`mb-1 rounded-md px-2 py-1 text-[10px] font-semibold ${
                        portfolio.totalReturn >= 0
                          ? "bg-[#eaf6ef] text-[#16805a]"
                          : "bg-[#faeeee] text-[#c65b5b]"
                      }`}
                    >
                      {portfolio.totalReturn >= 0
                        ? "+"
                        : ""}
                      {portfolio.totalReturnPercent.toFixed(
                        2
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="flex max-w-full overflow-x-auto rounded-xl bg-[#f5f7f3] p-1">
                  {[
                    "1D",
                    "1W",
                    "1M",
                    "3M",
                    "1Y",
                    "All",
                  ].map((period) => (
                    <button
                      key={period}
                      onClick={() =>
                        setActivePeriod(period)
                      }
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-[9px] font-semibold transition ${
                        activePeriod === period
                          ? "bg-white text-[#16805a] shadow-sm"
                          : "text-[#929b95]"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHART */}
              <div className="relative mt-6 h-[260px] overflow-hidden rounded-2xl border border-[#edf0ed] bg-[#fafcf9] sm:h-[320px]">
                {chartSnapshots.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-full bg-white px-4 py-2 text-[10px] font-medium text-[#909991] shadow-sm">
                      No portfolio history yet
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0">
                      {[20, 40, 60, 80].map(
                        (position) => (
                          <div
                            key={position}
                            className="absolute left-0 right-0 border-t border-[#edf0ed]"
                            style={{
                              top: `${position}%`,
                            }}
                          />
                        )
                      )}
                    </div>

                    <svg
                      viewBox="0 0 1000 280"
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full"
                    >
                      <polyline
                        points={chartPoints}
                        fill="none"
                        stroke="#16805a"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[9px] text-[#9aa39d]">
                      <span>
                        {formatDate(
                          chartSnapshots[0]
                            .created_at
                        )}
                      </span>

                      <span>
                        {chartSnapshots.length}{" "}
                        snapshots
                      </span>

                      <span>NOW</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* MIDDLE GRID */}
            <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              {/* TOP HOLDINGS */}
              
<section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-[#89928b]">
        Investments
      </p>

      <h3 className="mt-1 text-lg font-semibold">
        Top holdings
      </h3>
    </div>

    <button
      onClick={() => router.push("/account/portfolio")}
      className="text-[10px] font-semibold text-[#16805a]"
    >
      View all
    </button>
  </div>

  <div className="mt-5">
    {topHoldings.length === 0 ? (
      <div className="rounded-2xl bg-[#fbfcfa] p-8 text-center text-xs text-[#929b95]">
        No holdings yet.
      </div>
    ) : (
      <div className="space-y-3">
        {topHoldings.map((holding) => {
          const returnPercent =
            holding.costBasis > 0
              ? (holding.profitLoss /
                  holding.costBasis) *
                100
              : 0;

          return (
            <div
              key={holding.id}
              className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4"
            >
              {/* TOP ROW */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
                    {holding.asset?.symbol?.slice(0, 2)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {holding.asset?.symbol}
                    </p>

                    <p className="truncate text-[9px] text-[#929b95]">
                      {holding.asset?.name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">
                    {formatMoney(holding.currentValue)}
                  </p>

                  <p
                    className={`mt-1 text-[10px] font-semibold ${
                      returnPercent >= 0
                        ? "text-[#16805a]"
                        : "text-[#c65b5b]"
                    }`}
                  >
                    {returnPercent >= 0 ? "+" : ""}
                    {returnPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* DETAILS */}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf0ed] pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[#a0a8a2]">
                    Quantity
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {holding.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[#a0a8a2]">
                    Avg. cost
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {formatMoney(holding.averageCost)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</section>

              {/* CASH */}
              <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
                <p className="text-xs text-[#89928b]">
                  Cash balances
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Available funds
                </h3>

                <div className="mt-5 space-y-3">
                  <CashBalanceRow
                    currency="USD"
                    amount={portfolio.usdCash}
                    subtitle="US Dollar"
                  />

                  <CashBalanceRow
                    currency="EUR"
                    amount={portfolio.eurCash}
                    subtitle="Euro"
                  />
                </div>

                <div className="mt-5 border-t border-[#edf0ed] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#929b95]">
                      Total USD equivalent
                    </span>

                    <span className="text-xs font-semibold">
                      {formatMoney(
                        portfolio.totalCashUsd
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push("/account/convert")
                  }
                  className="mt-5 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-2.5 text-[10px] font-semibold transition hover:bg-[#f5f7f3]"
                >
                  Convert currencies
                </button>
              </section>
            </section>

            {/* LOWER GRID */}
            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              {/* RECENT ACTIVITY */}
              <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#89928b]">
                      Activity
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                      Recent activity
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      router.push(
                        "/account/transactions"
                      )
                    }
                    className="text-[10px] font-semibold text-[#16805a]"
                  >
                    View all
                  </button>
                </div>

<div className="mt-5 space-y-4">
  {activities.length === 0 ? (
    <div className="rounded-2xl bg-[#fbfcfa] p-8 text-center text-xs text-[#929b95]">
      No recent activity.
    </div>
  ) : (
    activities.map((activity) => {
      return (
        <ActivityRow
          key={activity.id}
          activity={activity}
        />
      );
    })
  )}
</div>


              </section>

              {/* MARKET WATCH */}
              <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#89928b]">
                      Markets
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                      Market watch
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      router.push("/account/markets")
                    }
                    className="text-[10px] font-semibold text-[#16805a]"
                  >
                    Explore markets
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
  {sortedMarketAssets.map(
    (asset) => (
      <WatchRow
        key={asset.symbol}
        symbol={asset.symbol}
        name={asset.name}
        price={formatMoney(
          Number(asset.current_price ?? 0)
        )}
        change={formatPercent(
          Number(asset.price_change_24h ?? 0)
        )}
        positive={
          Number(asset.price_change_24h ?? 0) >= 0
        }
      />
    )
  )}
</div>
              </section>
            </section>

            {/* QUICK ACTIONS */}
            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
              <p className="text-xs text-[#89928b]">
                Actions
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Quick actions
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <QuickAction
                  icon={<TradeIcon />}
                  title="Trade"
                  description="Buy or sell an asset"
                  onClick={() =>
                    router.push(
                      "/account/trade"
                    )
                  }
                />

                <QuickAction
                  icon={<TransferIcon />}
                  title="Transfer"
                  description="Move money securely"
                  onClick={() =>
                    router.push(
                      "/account/transfers"
                    )
                  }
                />

                <QuickAction
                  icon={<ConvertIcon />}
                  title="Convert"
                  description="Exchange currencies"
                  onClick={() =>
                    router.push(
                      "/account/convert"
                    )
                  }
                />

                <QuickAction
                  icon={<PortfolioIcon />}
                  title="Portfolio"
                  description="Manage your investments"
                  onClick={() =>
                    router.push(
                      "/account/portfolio"
                    )
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------- */
/* HELPERS */
/* -------------------------------- */

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2
  )}%`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

function formatTransactionType(
  type: string
) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* -------------------------------- */
/* NAVIGATION */
/* -------------------------------- */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${
        active
          ? "bg-[#e7f2eb] font-semibold text-[#16805a]"
          : "text-[#68736b] hover:bg-[#f5f7f3] hover:text-[#111613]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* -------------------------------- */
/* METRIC CARD */
/* -------------------------------- */

function MetricCard({
  label,
  value,
  change,
  positive,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,25,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-[#89928b]">
            {label}
          </p>

          <p className="mt-3 truncate text-[23px] font-semibold tracking-[-0.04em] sm:text-[25px]">
            {value}
          </p>

          <span
            className={`mt-2 inline-block rounded-md px-2 py-1 text-[9px] font-semibold ${
              positive
                ? "bg-[#eaf6ef] text-[#16805a]"
                : "bg-[#f3f5f2] text-[#727c75]"
            }`}
          >
            {change}
          </span>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5f0] text-[#16805a]">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* CASH BALANCE */
/* -------------------------------- */

function CashBalanceRow({
  currency,
  amount,
  subtitle,
}: {
  currency: string;
  amount: number;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ed] text-[10px] font-bold text-[#16805a]">
          {currency}
        </div>

        <div>
          <p className="text-xs font-semibold">
            {currency}
          </p>

          <p className="text-[9px] text-[#929b95]">
            {subtitle}
          </p>
        </div>
      </div>

      <p className="text-xs font-semibold">
        {currency === "USD"
          ? formatMoney(amount)
          : `${amount.toFixed(2)} EUR`}
      </p>
    </div>
  );
}

/* -------------------------------- */
/* HOLDING ROW */
/* -------------------------------- */

function HoldingRow({
  symbol,
  name,
  qty,
  price,
  value,
  returnValue,
  positive,
}: {
  symbol: string;
  name: string;
  qty: string;
  price: string;
  value: string;
  returnValue: string;
  positive: boolean;
}) {
  return (
    <tr className="border-b border-[#f0f2ef] last:border-0">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
            {symbol.slice(0, 2)}
          </div>

          <div>
            <p className="text-xs font-semibold">
              {symbol}
            </p>

            <p className="text-[9px] text-[#909991]">
              {name}
            </p>
          </div>
        </div>
      </td>

      <td className="py-4 text-xs text-[#68736b]">
        {qty}
      </td>

      <td className="py-4 text-xs text-[#68736b]">
        {price}
      </td>

      <td className="py-4 text-xs font-semibold">
        {value}
      </td>

      <td
        className={`py-4 text-right text-xs font-semibold ${
          positive
            ? "text-[#16805a]"
            : "text-[#c65b5b]"
        }`}
      >
        {returnValue}
      </td>
    </tr>
  );
}

/* -------------------------------- */
/* ACTIVITY */
/* -------------------------------- */

function ActivityRow({
  activity,
}: {
  activity: Activity;
}) {
  const amount = Number(activity.amount ?? 0);

  const isCredit =
    activity.transaction_type ===
      "deposit" ||
    activity.transaction_type === "sell";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf0ed] pb-4 last:border-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5ef] text-[#16805a]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">
            {formatTransactionType(
              activity.transaction_type
            )}
          </p>

          <p className="mt-0.5 truncate text-[9px] text-[#929b95]">
            {activity.description ||
              activity.reference ||
              formatDate(
                activity.created_at
              )}{" "}
            ·{" "}
            {formatDate(
              activity.created_at
            )}
          </p>
        </div>
      </div>

      <span
        className={`shrink-0 text-xs font-semibold ${
          isCredit
            ? "text-[#16805a]"
            : "text-[#566158]"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatMoney(Math.abs(amount))}
      </span>
    </div>
  );
}

/* -------------------------------- */
/* MARKET WATCH */
/* -------------------------------- */

function WatchRow({
  symbol,
  name,
  price,
  change,
  positive,
}: {
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
}) {
  return (
    <button
      onClick={() =>
        window.location.assign(
          `/account/markets?symbol=${symbol}`
        )
      }
      className="flex items-center justify-between rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-3 text-left transition hover:border-[#d6ded8] hover:bg-white"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ed] text-[10px] font-bold text-[#16805a]">
          {symbol.slice(0, 2)}
        </div>

        <div>
          <p className="text-xs font-semibold">
            {symbol}
          </p>

          <p className="max-w-[110px] truncate text-[9px] text-[#909991]">
            {name}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs font-semibold">
          {price}
        </p>

        <p
          className={`text-[9px] font-semibold ${
            positive
              ? "text-[#16805a]"
              : "text-[#c65b5b]"
          }`}
        >
          {change}
        </p>
      </div>
    </button>
  );
}

/* -------------------------------- */
/* QUICK ACTION */
/* -------------------------------- */

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#d6ded8] hover:bg-white"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ed] text-[#16805a]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] text-[#909991]">
          {description}
        </p>
      </div>

      <ArrowIcon />
    </button>
  );
}

/* -------------------------------- */
/* ICONS */
/* -------------------------------- */

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 11h17" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 18V6M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m7 15 4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14M14 4l5 4-5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 16H5m5-4-5 4 5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CryptoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 7v10M13 7v10M9 9h4a2 2 0 1 1 0 4H9h4a2 2 0 1 1 0 4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 7h10l-3-3M17 17H7l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7v4M7 17v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v16H6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14M15 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 16H5m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m7 15 3-3 3 2 5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3v-3.5a2.5 2.5 0 0 1-1.5-2.3v-6.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 8h15" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 17 10 11l4 4 6-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h4v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 12a7 7 0 1 0 2-4.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 5v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M6 17h12l-1.2-1.8V11a4.8 4.8 0 0 0-9.6 0v4.2L6 17Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 20h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}