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
  portfolio_value: number;
  created_at: string;
};

type Holding = {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  profitLoss: number;
  returnPercent: number;
  priceChange24h: number;
};

export default function PortfolioPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [cashBalances, setCashBalances] = useState<CashBalance[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUser(session.user);

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
          .eq("user_id", session.user.id);

      if (positionError) {
        console.error(
          "Portfolio positions error:",
          positionError
        );
      }

      const { data: cashData, error: cashError } =
        await supabase
          .from("cash_balances")
          .select("currency, available_balance")
          .eq("user_id", session.user.id);

      if (cashError) {
        console.error(
          "Portfolio cash error:",
          cashError
        );
      }

      const { data: snapshotData, error: snapshotError } =
        await supabase
          .from("portfolio_snapshots")
          .select("portfolio_value, created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true })
          .limit(100);

      if (snapshotError) {
        console.error(
          "Portfolio snapshots error:",
          snapshotError
        );
      }

      setPositions((positionData ?? []) as Position[]);
      setCashBalances(cashData ?? []);
      setSnapshots(snapshotData ?? []);
      setLoading(false);
    };

    loadPortfolio();
  }, [router]);

  const portfolio = useMemo(() => {
    let invested = 0;
    let marketValue = 0;

    const holdings: Holding[] = positions
      .filter((position) => position.asset)
      .map((position) => {
        const quantity = Number(position.quantity ?? 0);

        const averageCost = Number(
          position.average_cost ?? 0
        );

        const currentPrice = Number(
          position.asset?.current_price ?? 0
        );

        const costBasis =
          quantity * averageCost;

        const currentValue =
          quantity * currentPrice;

        const profitLoss =
          currentValue - costBasis;

        const returnPercent =
          costBasis > 0
            ? (profitLoss / costBasis) * 100
            : 0;

        invested += costBasis;
        marketValue += currentValue;

        return {
          id: position.id,
          symbol: position.asset?.symbol ?? "",
          name: position.asset?.name ?? "",
          assetType:
            position.asset?.asset_type ?? "other",
          quantity,
          averageCost,
          currentPrice,
          marketValue: currentValue,
          costBasis,
          profitLoss,
          returnPercent,
          priceChange24h: Number(
            position.asset?.price_change_24h ?? 0
          ),
        };
      });

    const usdCash = Number(
      cashBalances.find(
        (item) => item.currency === "USD"
      )?.available_balance ?? 0
    );

    const eurCash = Number(
      cashBalances.find(
        (item) => item.currency === "EUR"
      )?.available_balance ?? 0
    );

    /*
      Existing account conversion estimate.

      This is intentionally kept manual for now because
      your platform is using manually entered market prices.
    */
    const eurToUsdRate = 1.0827;

    const eurCashUsdValue =
      eurCash * eurToUsdRate;

    const totalCashUsd =
      usdCash + eurCashUsdValue;

    const totalPortfolioValue =
      marketValue + totalCashUsd;

    const totalProfitLoss =
      marketValue - invested;

    const profitLossPercent =
      invested > 0
        ? (totalProfitLoss / invested) * 100
        : 0;

    const cashAllocation =
      totalPortfolioValue > 0
        ? (totalCashUsd / totalPortfolioValue) * 100
        : 0;

    const investmentAllocation =
      totalPortfolioValue > 0
        ? (marketValue / totalPortfolioValue) * 100
        : 0;

    const allocationByType = holdings.reduce<
      Record<string, number>
    >((result, holding) => {
      const type = holding.assetType || "other";

      result[type] =
        (result[type] ?? 0) +
        holding.marketValue;

      return result;
    }, {});

    return {
      holdings,
      invested,
      marketValue,
      usdCash,
      eurCash,
      eurCashUsdValue,
      totalCashUsd,
      totalPortfolioValue,
      totalProfitLoss,
      profitLossPercent,
      cashAllocation,
      investmentAllocation,
      allocationByType,
    };
  }, [positions, cashBalances]);

  const latestSnapshot = useMemo(() => {
    if (snapshots.length === 0) {
      return null;
    }

    return snapshots[snapshots.length - 1];
  }, [snapshots]);

  const todayGain = useMemo(() => {
    if (!latestSnapshot) {
      return 0;
    }

    const previousValue = Number(
      latestSnapshot.portfolio_value ?? 0
    );

    if (previousValue <= 0) {
      return 0;
    }

    return (
      portfolio.totalPortfolioValue -
      previousValue
    );
  }, [
    latestSnapshot,
    portfolio.totalPortfolioValue,
  ]);

  const todayGainPercent = useMemo(() => {
    if (!latestSnapshot) {
      return 0;
    }

    const previousValue = Number(
      latestSnapshot.portfolio_value ?? 0
    );

    if (previousValue <= 0) {
      return 0;
    }

    return (
      (todayGain / previousValue) * 100
    );
  }, [latestSnapshot, todayGain]);

  const chartValues = useMemo(() => {
    if (snapshots.length === 0) {
      return [];
    }

    return snapshots.map((snapshot, index) => {
      if (index === snapshots.length - 1) {
        return portfolio.totalPortfolioValue;
      }

      return Number(
        snapshot.portfolio_value ?? 0
      );
    });
  }, [
    snapshots,
    portfolio.totalPortfolioValue,
  ]);

  const chartMin = useMemo(() => {
    if (chartValues.length === 0) {
      return 0;
    }

    return Math.min(...chartValues);
  }, [chartValues]);

  const chartMax = useMemo(() => {
    if (chartValues.length === 0) {
      return 0;
    }

    return Math.max(...chartValues);
  }, [chartValues]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  const sortedHoldings = useMemo(() => {
    return [...portfolio.holdings].sort(
      (a, b) => b.marketValue - a.marketValue
    );
  }, [portfolio.holdings]);

  const allocationItems = useMemo(() => {
    const items: {
      label: string;
      description: string;
      value: number;
      percent: number;
    }[] = [];

    if (portfolio.totalCashUsd > 0) {
      items.push({
        label: "Cash",
        description: "Available cash",
        value: portfolio.totalCashUsd,
        percent: portfolio.cashAllocation,
      });
    }

    const labels: Record<string, string> = {
      stock: "Stocks",
      stocks: "Stocks",
      etf: "ETFs",
      crypto: "Crypto",
      index: "Indexes",
      bond: "Bonds",
      mutual_fund: "Mutual funds",
      other: "Other",
    };

    Object.entries(
      portfolio.allocationByType
    ).forEach(([type, value]) => {
      if (value <= 0) {
        return;
      }

      items.push({
        label:
          labels[type.toLowerCase()] ??
          capitalize(type),
        description: `${formatAssetType(type)} holdings`,
        value,
        percent:
          portfolio.totalPortfolioValue > 0
            ? (value /
                portfolio.totalPortfolioValue) *
              100
            : 0,
      });
    });

    return items.sort(
      (a, b) => b.value - a.value
    );
  }, [
    portfolio.totalCashUsd,
    portfolio.cashAllocation,
    portfolio.allocationByType,
    portfolio.totalPortfolioValue,
  ]);

  const largestPosition = useMemo(() => {
    if (sortedHoldings.length === 0) {
      return null;
    }

    return sortedHoldings[0];
  }, [sortedHoldings]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading portfolio...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push("/account")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] transition hover:text-[#111613]"
              aria-label="Back to account"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Investment workspace
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Portfolio
              </h1>
            </div>
          </div>

          <button
            onClick={() =>
              router.push(
                "/account/settings"
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
            title={user?.email ?? "Account"}
          >
            {displayName
              .charAt(0)
              .toUpperCase()}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">
        {/* PORTFOLIO INTRO */}
        <div>
          <p className="text-sm text-[#7b857e]">
            Your investments, cash and portfolio
            performance in one place.
          </p>

          <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-[30px] font-semibold tracking-[-0.04em]">
                Your portfolio
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  router.push(
                    "/account/transfers"
                  )
                }
                className="rounded-xl border border-[#dfe5df] bg-white px-4 py-2 text-xs font-semibold text-[#111613] transition hover:bg-[#f8faf7]"
              >
                Add money
              </button>

              <button
                onClick={() =>
                  router.push("/account/trade")
                }
                className="rounded-xl bg-[#111613] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#202622]"
              >
                Trade
              </button>
            </div>
          </div>
        </div>

        {/* TOTAL PORTFOLIO VALUE */}
        <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-6 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8f9992]">
                Total portfolio value
              </p>

              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {formatCurrency(
                  portfolio.totalPortfolioValue
                )}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    todayGain >= 0
                      ? "text-[#16805a]"
                      : "text-[#c65b5b]"
                  }`}
                >
                  {todayGain >= 0 ? "+" : ""}
                  {formatCurrency(todayGain)}
                </span>

                <span
                  className={`text-sm font-medium ${
                    todayGain >= 0
                      ? "text-[#16805a]"
                      : "text-[#c65b5b]"
                  }`}
                >
                  ({todayGainPercent >= 0
                    ? "+"
                    : ""}
                  {todayGainPercent.toFixed(2)}%
                  today)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <MiniStat
                label="Invested"
                value={formatCurrency(
                  portfolio.invested
                )}
              />

              <MiniStat
                label="Cash"
                value={formatCurrency(
                  portfolio.totalCashUsd
                )}
              />

              <MiniStat
                label="Total return"
                value={`${
                  portfolio.totalProfitLoss >=
                  0
                    ? "+"
                    : ""
                }${formatCurrency(
                  portfolio.totalProfitLoss
                )}`}
                positive={
                  portfolio.totalProfitLoss >= 0
                }
              />
            </div>
          </div>
        </section>

        {/* PERFORMANCE */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Performance
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Portfolio value
              </h3>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-[9px] font-semibold ${
                todayGain >= 0
                  ? "bg-[#eaf6ef] text-[#16805a]"
                  : "bg-[#faeeee] text-[#c65b5b]"
              }`}
            >
              {todayGain >= 0
                ? "Gaining"
                : "Declining"}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4 sm:p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] text-[#929b95]">
                  Current value
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(
                    portfolio.totalPortfolioValue
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] text-[#929b95]">
                  Total return
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    portfolio.totalProfitLoss >=
                    0
                      ? "text-[#16805a]"
                      : "text-[#c65b5b]"
                  }`}
                >
                  {portfolio.totalProfitLoss >=
                  0
                    ? "+"
                    : ""}
                  {formatCurrency(
                    portfolio.totalProfitLoss
                  )}
                </p>
              </div>
            </div>

            {/* CHART */}
            <div className="mt-7 h-48 rounded-2xl border border-[#edf0ed] bg-white p-4">
              {chartValues.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-[#929b95]">
                  No portfolio history
                  available yet.
                </div>
              ) : (
                <div className="flex h-full items-end gap-1">
                  {chartValues.map(
                    (value, index) => {
                      const range =
                        chartMax -
                          chartMin || 1;

                      const height = Math.max(
                        ((value - chartMin) /
                          range) *
                          100,
                        8
                      );

                      return (
                        <div
                          key={`${value}-${index}`}
                          className="flex h-full flex-1 items-end"
                          title={`Snapshot ${index + 1}: ${formatCurrency(value)}`}
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

            {snapshots.length > 0 && (
              <div className="mt-3 flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.08em] text-[#9aa39d]">
                <span>
                  {new Date(
                    snapshots[0].created_at
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>

                <span>
                  {snapshots.length} snapshots
                </span>

                <span>NOW</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-5 text-[9px] font-semibold text-[#9aa39d]">
              <span className="text-[#16805a]">
                1D
              </span>
              <span>1W</span>
              <span>1M</span>
              <span>3M</span>
              <span>1Y</span>
              <span>ALL</span>
            </div>
          </div>
        </section>

        {/* CASH & BUYING POWER */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs text-[#89928b]">
                Cash & buying power
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Available balance
              </h3>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[9px] uppercase tracking-[0.1em] text-[#929b95]">
                Total cash
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(
                  portfolio.totalCashUsd
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <CashCard
              currency="USD"
              balance={portfolio.usdCash}
              usdValue={portfolio.usdCash}
              description="Available US dollars"
            />

            <CashCard
              currency="EUR"
              balance={portfolio.eurCash}
              usdValue={
                portfolio.eurCashUsdValue
              }
              description="Available euros"
              estimated
            />
          </div>
        </section>

        {/* POSITIONS */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs text-[#89928b]">
                Investments
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Positions
              </h3>
            </div>

            <span className="text-[10px] text-[#929b95]">
              {sortedHoldings.length}{" "}
              {sortedHoldings.length === 1
                ? "position"
                : "positions"}
            </span>
          </div>

          {/* DESKTOP TABLE */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">
                  <th className="pb-3 font-semibold">
                    Position
                  </th>

                  <th className="pb-3 font-semibold">
                    Quantity
                  </th>

                  <th className="pb-3 font-semibold">
                    Avg. cost
                  </th>

                  <th className="pb-3 font-semibold">
                    Price
                  </th>

                  <th className="pb-3 font-semibold">
                    Market value
                  </th>

                  <th className="pb-3 font-semibold">
                    Today
                  </th>

                  <th className="pb-3 text-right font-semibold">
                    Total return
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedHoldings.map(
                  (holding) => (
                    <PositionRow
                      key={holding.id}
                      holding={holding}
                    />
                  )
                )}

                {sortedHoldings.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center"
                    >
                      <p className="text-sm font-semibold">
                        No positions yet
                      </p>

                      <p className="mt-1 text-xs text-[#929b95]">
                        Your investments will
                        appear here after you
                        make a trade.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE POSITIONS */}
          <div className="mt-5 space-y-3 md:hidden">
            {sortedHoldings.map(
              (holding) => (
                <MobilePositionCard
                  key={holding.id}
                  holding={holding}
                />
              )
            )}

            {sortedHoldings.length === 0 && (
              <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-8 text-center">
                <p className="text-sm font-semibold">
                  No positions yet
                </p>

                <p className="mt-1 text-xs text-[#929b95]">
                  Your investments will
                  appear here after you
                  make a trade.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ALLOCATION */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <div>
              <p className="text-xs text-[#89928b]">
                Portfolio allocation
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Where your money is
              </h3>
            </div>

            <div className="mt-6 space-y-5">
              {allocationItems.length === 0 ? (
                <p className="text-xs text-[#929b95]">
                  No allocation data yet.
                </p>
              ) : (
                allocationItems.map(
                  (item) => (
                    <AllocationRow
                      key={item.label}
                      label={item.label}
                      description={
                        item.description
                      }
                      value={formatCurrency(
                        item.value
                      )}
                      percent={item.percent}
                    />
                  )
                )
              )}
            </div>
          </section>

          {/* PORTFOLIO DETAILS */}
          <section className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
            <p className="text-xs text-[#89928b]">
              Portfolio details
            </p>

            <h3 className="mt-1 text-lg font-semibold">
              Account overview
            </h3>

            <div className="mt-6 divide-y divide-[#edf0ed]">
              <DetailRow
                label="Invested capital"
                value={formatCurrency(
                  portfolio.invested
                )}
              />

              <DetailRow
                label="Market value"
                value={formatCurrency(
                  portfolio.marketValue
                )}
              />

              <DetailRow
                label="Available cash"
                value={formatCurrency(
                  portfolio.totalCashUsd
                )}
              />

              <DetailRow
                label="Positions"
                value={`${portfolio.holdings.length}`}
              />

              <DetailRow
                label="Largest position"
                value={
                  largestPosition?.symbol ??
                  "—"
                }
              />

              <DetailRow
                label="Total return"
                value={`${
                  portfolio.totalProfitLoss >=
                  0
                    ? "+"
                    : ""
                }${formatCurrency(
                  portfolio.totalProfitLoss
                )}`}
                positive={
                  portfolio.totalProfitLoss >= 0
                }
              />
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function PositionRow({
  holding,
}: {
  holding: Holding;
}) {
  const todayPercent =
    holding.priceChange24h;

  const todayPositive =
    todayPercent >= 0;

  return (
    <tr className="border-b border-[#f0f2ef] last:border-0">
      <td className="py-5">
        <div className="flex items-center gap-3">
          <AssetIcon
            symbol={holding.symbol}
            assetType={holding.assetType}
          />

          <div>
            <p className="text-xs font-semibold">
              {holding.symbol}
            </p>

            <p className="text-[9px] text-[#929b95]">
              {holding.name}
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.08em] text-[#b0b7b2]">
              {formatAssetType(
                holding.assetType
              )}
            </p>
          </div>
        </div>
      </td>

      <td className="py-5 text-xs">
        {formatQuantity(
          holding.quantity
        )}
      </td>

      <td className="py-5 text-xs">
        {formatCurrency(
          holding.averageCost
        )}
      </td>

      <td className="py-5 text-xs font-semibold">
        {formatCurrency(
          holding.currentPrice
        )}
      </td>

      <td className="py-5 text-xs font-semibold">
        {formatCurrency(
          holding.marketValue
        )}
      </td>

      <td
        className={`py-5 text-xs font-semibold ${
          todayPositive
            ? "text-[#16805a]"
            : "text-[#c65b5b]"
        }`}
      >
        {todayPositive ? "+" : ""}
        {todayPercent.toFixed(2)}%
      </td>

      <td
        className={`py-5 text-right text-xs font-semibold ${
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

        <span className="ml-1 text-[9px]">
          (
          {holding.returnPercent >= 0
            ? "+"
            : ""}
          {holding.returnPercent.toFixed(2)}
          %)
        </span>
      </td>
    </tr>
  );
}

function MobilePositionCard({
  holding,
}: {
  holding: Holding;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetIcon
            symbol={holding.symbol}
            assetType={holding.assetType}
          />

          <div>
            <p className="text-sm font-semibold">
              {holding.symbol}
            </p>

            <p className="text-[9px] text-[#929b95]">
              {holding.name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold">
            {formatCurrency(
              holding.marketValue
            )}
          </p>

          <p
            className={`text-[9px] font-semibold ${
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
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf0ed] pt-4">
        <MobileDetail
          label="Quantity"
          value={formatQuantity(
            holding.quantity
          )}
        />

        <MobileDetail
          label="Current price"
          value={formatCurrency(
            holding.currentPrice
          )}
        />

        <MobileDetail
          label="Average cost"
          value={formatCurrency(
            holding.averageCost
          )}
        />

        <MobileDetail
          label="Return"
          value={`${
            holding.returnPercent >= 0
              ? "+"
              : ""
          }${holding.returnPercent.toFixed(
            2
          )}%`}
          positive={
            holding.returnPercent >= 0
          }
        />
      </div>
    </div>
  );
}

function MobileDetail({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.08em] text-[#9aa39d]">
        {label}
      </p>

      <p
        className={`mt-1 text-xs font-semibold ${
          positive === undefined
            ? "text-[#111613]"
            : positive
              ? "text-[#16805a]"
              : "text-[#c65b5b]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AssetIcon({
  symbol,
  assetType,
}: {
  symbol: string;
  assetType: string;
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
      {assetType === "crypto"
        ? "₿"
        : symbol.slice(0, 2)}
    </div>
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

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.08em] text-[#9aa39d]">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${
          positive === undefined
            ? "text-[#111613]"
            : positive
              ? "text-[#16805a]"
              : "text-[#c65b5b]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AllocationRow({
  label,
  description,
  value,
  percent,
}: {
  label: string;
  description: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold">
            {label}
          </p>

          <p className="text-[9px] text-[#929b95]">
            {description}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold">
            {value}
          </p>

          <p className="text-[9px] text-[#929b95]">
            {percent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0ed]">
        <div
          className="h-full rounded-full bg-[#16805a]"
          style={{
            width: `${Math.min(
              Math.max(percent, 0),
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function CashCard({
  currency,
  balance,
  usdValue,
  description,
  estimated,
}: {
  currency: string;
  balance: number;
  usdValue: number;
  description: string;
  estimated?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#edf0ed] bg-[#fbfcfa] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#929b95]">
            Cash balance
          </p>

          <p className="mt-1 text-lg font-semibold">
            {currency}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#16805a]">
          {currency === "USD"
            ? "$"
            : currency === "EUR"
              ? "€"
              : currency.slice(0, 1)}
        </div>
      </div>

      <p className="mt-5 text-2xl font-semibold">
        {currency === "USD"
          ? formatCurrency(balance)
          : `€${balance.toFixed(2)}`}
      </p>

      <p className="mt-1 text-[10px] text-[#929b95]">
        {description}
      </p>

      {currency !== "USD" && (
        <div className="mt-4 border-t border-[#edf0ed] pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#929b95]">
              USD equivalent
            </span>

            <span className="text-xs font-semibold">
              ~
              {formatCurrency(
                usdValue
              )}
            </span>
          </div>

          {estimated && (
            <p className="mt-1 text-[8px] text-[#a1a9a3]">
              Estimated using account
              conversion rate
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-xs text-[#7f8982]">
        {label}
      </span>

      <span
        className={`text-xs font-semibold ${
          positive === undefined
            ? "text-[#111613]"
            : positive
              ? "text-[#16805a]"
              : "text-[#c65b5b]"
        }`}
      >
        {value}
      </span>
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

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(value);
}

function formatAssetType(
  type: string
) {
  const labels: Record<string, string> = {
    stock: "Stock",
    stocks: "Stock",
    etf: "ETF",
    crypto: "Crypto",
    index: "Index",
    bond: "Bond",
    mutual_fund: "Mutual fund",
    cash: "Cash",
    other: "Other",
  };

  return (
    labels[type.toLowerCase()] ??
    capitalize(type)
  );
}

function capitalize(value: string) {
  if (!value) {
    return "Other";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
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