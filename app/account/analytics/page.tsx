
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Position = {
  id: string;
  quantity: number;
  average_cost: number;
  asset: {
    symbol: string;
    name: string;
    asset_type: string;
    current_price: number | null;
    price_change_24h: number | null;
  } | null;
};

type CashBalance = {
  currency: string;
  available_balance: number;
};

type PortfolioSnapshot = {
  id: string;
  portfolio_value: number;
  cash_value: number;
  invested_value: number;
  created_at: string;
};

export default function AnalyticsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalances, setCashBalances] = useState<CashBalance[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { error: snapshotCreateError } = await supabase.rpc(
        "create_portfolio_snapshot"
      );

      if (snapshotCreateError) {
        console.error(
          "Snapshot creation error:",
          snapshotCreateError
        );
      }

      const { data: positionData, error: positionError } =
        await supabase
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
          .eq("user_id", user.id);

      if (positionError) {
        console.error(
          "Analytics positions error:",
          positionError
        );
      }

      const { data: cashData, error: cashError } =
        await supabase
          .from("cash_balances")
          .select("currency, available_balance")
          .eq("user_id", user.id);

      if (cashError) {
        console.error(
          "Analytics cash error:",
          cashError
        );
      }

      const { data: snapshotData, error: snapshotError } =
        await supabase
          .from("portfolio_snapshots")
          .select(
            "id, portfolio_value, cash_value, invested_value, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

      if (snapshotError) {
        console.error(
          "Analytics snapshot error:",
          snapshotError
        );
      }

      setPositions((positionData ?? []) as Position[]);
      setCashBalances(cashData ?? []);
      setSnapshots((snapshotData ?? []) as PortfolioSnapshot[]);
      setLoading(false);
    };

    loadAnalytics();
  }, [router]);

  const portfolio = useMemo(() => {
    let invested = 0;
    let marketValue = 0;

    const holdings = positions
      .filter((position) => position.asset)
      .map((position) => {
        const quantity = Number(position.quantity ?? 0);
        const averageCost = Number(position.average_cost ?? 0);
        const currentPrice = Number(
          position.asset?.current_price ?? 0
        );

        const costBasis = quantity * averageCost;
        const currentValue = quantity * currentPrice;
        const profitLoss = currentValue - costBasis;

        invested += costBasis;
        marketValue += currentValue;

        return {
          ...position,
          quantity,
          averageCost,
          currentPrice,
          costBasis,
          currentValue,
          profitLoss,
        };
      });

    const usdCash =
      cashBalances.find(
        (item) => item.currency === "USD"
      )?.available_balance ?? 0;

    const totalPortfolioValue =
      marketValue + Number(usdCash);

    const totalProfitLoss =
      marketValue - invested;

    const profitLossPercent =
      invested > 0
        ? (totalProfitLoss / invested) * 100
        : 0;

    return {
      holdings,
      invested,
      marketValue,
      usdCash: Number(usdCash),
      totalPortfolioValue,
      totalProfitLoss,
      profitLossPercent,
    };
  }, [positions, cashBalances]);

  const chartValues = useMemo(() => {
    if (snapshots.length === 0) {
      return [];
    }

    return snapshots.map((snapshot, index) => {
      if (index === snapshots.length - 1) {
        return portfolio.totalPortfolioValue;
      }

      return Number(snapshot.portfolio_value ?? 0);
    });
  }, [snapshots, portfolio.totalPortfolioValue]);

  const chartMax = useMemo(() => {
    if (chartValues.length === 0) {
      return 0;
    }

    return Math.max(...chartValues, 1);
  }, [chartValues]);

  const chartMin = useMemo(() => {
    if (chartValues.length === 0) {
      return 0;
    }

    return Math.min(...chartValues, 0);
  }, [chartValues]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading analytics...
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
                Analytics
              </h1>
            </div>
          </div>

          <button
            onClick={() =>
              router.push("/account/settings")
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
            title={user?.email ?? "Account"}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">
        <div>
          <p className="text-sm text-[#7b857e]">
            Understand your portfolio performance and allocation.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Portfolio analytics
          </h2>
        </div>

        {/* SUMMARY CARDS */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Portfolio value"
            value={formatCurrency(
              portfolio.totalPortfolioValue
            )}
            description="Investments + USD cash"
          />

          <MetricCard
            label="Invested capital"
            value={formatCurrency(
              portfolio.invested
            )}
            description="Current cost basis"
          />

          <MetricCard
            label="Cash available"
            value={formatCurrency(
              portfolio.usdCash
            )}
            description="Available USD"
          />

          <MetricCard
            label="Profit / loss"
            value={`${
              portfolio.totalProfitLoss >= 0
                ? "+"
                : ""
            }${formatCurrency(
              portfolio.totalProfitLoss
            )}`}
            description={`${
              portfolio.profitLossPercent >= 0
                ? "+"
                : ""
            }${portfolio.profitLossPercent.toFixed(2)}%`}
            positive={
              portfolio.totalProfitLoss >= 0
            }
          />
        </section>

        {/* PERFORMANCE */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#89928b]">
                  Portfolio performance
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Current portfolio
                </h3>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[9px] font-semibold ${
                  portfolio.totalProfitLoss >= 0
                    ? "bg-[#eaf6ef] text-[#16805a]"
                    : "bg-[#faeeee] text-[#c65b5b]"
                }`}
              >
                {portfolio.totalProfitLoss >= 0
                  ? "Gaining"
                  : "Declining"}
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] text-[#929b95]">
                    Portfolio value
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(
                      portfolio.totalPortfolioValue
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] text-[#929b95]">
                    P/L
                  </p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      portfolio.totalProfitLoss >= 0
                        ? "text-[#16805a]"
                        : "text-[#c65b5b]"
                    }`}
                  >
                    {portfolio.totalProfitLoss >= 0
                      ? "+"
                      : ""}
                    {formatCurrency(
                      portfolio.totalProfitLoss
                    )}
                  </p>
                </div>
              </div>

              {/* PERFORMANCE CHART */}
              <div className="mt-8 h-44 rounded-2xl border border-[#edf0ed] bg-white p-4">
                {snapshots.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-[#929b95]">
                    No portfolio history available yet.
                  </div>
                ) : (
                  <div className="flex h-full items-end gap-1">
                    {snapshots.map(
                      (snapshot, index) => {
                        const value =
                          index === snapshots.length - 1
                            ? portfolio.totalPortfolioValue
                            : Number(
                                snapshot.portfolio_value ?? 0
                              );

                        const range =
                          chartMax - chartMin || 1;

                        const height = Math.max(
                          ((value - chartMin) /
                            range) *
                            100,
                          8
                        );

                        return (
                          <div
                            key={snapshot.id}
                            className="flex h-full flex-1 items-end"
                            title={`${
                              index ===
                              snapshots.length - 1
                                ? "Current portfolio"
                                : new Date(
                                    snapshot.created_at
                                  ).toLocaleString()
                            } — ${formatCurrency(value)}`}
                          >
                            <div
                              className="w-full rounded-t-md bg-[#16805a]"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* CHART LABELS */}
              {snapshots.length > 0 && (
                <div className="mt-3 flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.08em] text-[#9aa39d]">
                  <span>
                    {new Date(
                      snapshots[0].created_at
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {snapshots.length > 1 && (
                    <span>
                      {snapshots.length > 2
                        ? `${snapshots.length} snapshots`
                        : "History"}
                    </span>
                  )}

                  <span>
                    NOW
                  </span>
                </div>
              )}

              {/* CHART RANGE */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px] font-semibold text-[#9aa39d]">
                  <span className="text-[#16805a]">
                    1D
                  </span>
                  <span>1W</span>
                  <span>1M</span>
                  <span>3M</span>
                  <span>1Y</span>
                  <span>All</span>
                </div>

                {chartValues.length > 0 && (
                  <div className="text-[9px] text-[#929b95]">
                    {formatCurrency(chartMin)} —{" "}
                    {formatCurrency(chartMax)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ALLOCATION */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_12px_35px_rgba(20,35,25,0.04)]">
            <p className="text-xs text-[#89928b]">
              Asset allocation
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              Holdings breakdown
            </h3>

            <div className="mt-6 space-y-4">
              {portfolio.holdings.length === 0 ? (
                <p className="text-xs text-[#929b95]">
                  No holdings yet.
                </p>
              ) : (
                portfolio.holdings.map((holding) => {
                  const percent =
                    portfolio.marketValue > 0
                      ? (holding.currentValue /
                          portfolio.marketValue) *
                        100
                      : 0;

                  return (
                    <div key={holding.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">
                            {holding.asset?.symbol}
                          </p>

                          <p className="text-[9px] text-[#929b95]">
                            {holding.asset?.name}
                          </p>
                        </div>

                        <span className="text-xs font-semibold">
                          {percent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ed]">
                        <div
                          className="h-full rounded-full bg-[#16805a]"
                          style={{
                            width: `${Math.min(
                              percent,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* CASH ALLOCATION */}
            <div className="mt-6 border-t border-[#edf0ed] pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">
                    Cash
                  </p>

                  <p className="text-[9px] text-[#929b95]">
                    Available USD
                  </p>
                </div>

                <span className="text-xs font-semibold">
                  {portfolio.totalPortfolioValue > 0
                    ? (
                        (portfolio.usdCash /
                          portfolio.totalPortfolioValue) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ed]">
                <div
                  className="h-full rounded-full bg-[#cbd4cd]"
                  style={{
                    width: `${
                      portfolio.totalPortfolioValue > 0
                        ? Math.min(
                            (portfolio.usdCash /
                              portfolio.totalPortfolioValue) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </section>
        </section>

        {/* HOLDINGS */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Portfolio holdings
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Performance by asset
              </h3>
            </div>

            <span className="text-[10px] text-[#929b95]">
              {portfolio.holdings.length} holdings
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">
                  <th className="pb-3 font-semibold">
                    Asset
                  </th>

                  <th className="pb-3 font-semibold">
                    Quantity
                  </th>

                  <th className="pb-3 font-semibold">
                    Avg. cost
                  </th>

                  <th className="pb-3 font-semibold">
                    Current value
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    P/L
                  </th>
                </tr>
              </thead>

              <tbody>
                {portfolio.holdings.map((holding) => (
                  <tr
                    key={holding.id}
                    className="border-b border-[#f0f2ef] last:border-0"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
                          {holding.asset?.symbol?.slice(
                            0,
                            2
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold">
                            {holding.asset?.symbol}
                          </p>

                          <p className="text-[9px] text-[#929b95]">
                            {holding.asset?.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-xs">
                      {holding.quantity}
                    </td>

                    <td className="py-4 text-xs">
                      {formatCurrency(
                        holding.averageCost
                      )}
                    </td>

                    <td className="py-4 text-xs font-semibold">
                      {formatCurrency(
                        holding.currentValue
                      )}
                    </td>

                    <td
                      className={`py-4 text-right text-xs font-semibold ${
                        holding.profitLoss >= 0
                          ? "text-[#16805a]"
                          : "text-[#c65b5b]"
                      }`}
                    >
                      {holding.profitLoss >= 0
                        ? "+"
                        : ""}
                      {formatCurrency(
                        holding.profitLoss
                      )}
                    </td>
                  </tr>
                ))}

                {portfolio.holdings.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-14 text-center text-sm text-[#8b948e]"
                    >
                      No holdings available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  positive,
}: {
  label: string;
  value: string;
  description: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,25,0.03)]">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#8f9992]">
        {label}
      </p>

      <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
        {value}
      </p>

      <p
        className={`mt-1 text-[10px] font-medium ${
          positive === undefined
            ? "text-[#929b95]"
            : positive
              ? "text-[#16805a]"
              : "text-[#c65b5b]"
        }`}
      >
        {description}
      </p>
    </div>
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
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
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