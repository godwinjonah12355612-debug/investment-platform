"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Order = {
  id: string;
  side: string;
  status: string;
  quantity: number;
  price: number | null;
  total: number | null;
  created_at: string;
  asset: {
    symbol: string;
    name: string;
  } | null;
};

export default function OrdersPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const loadOrders = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
  .from("transactions")
  .select(
    "id, transaction_type, status, asset_id, currency, amount, fee, reference, description, metadata, created_at"
  )
  .eq("user_id", session.user.id)
  .in("transaction_type", ["buy", "sell"])
  .order("created_at", { ascending: false });

if (error) {
  console.error("Orders error:", error);
  setOrders([]);
} else {
  const assetIds = [
    ...new Set(
      (data ?? [])
        .map((transaction) => transaction.asset_id)
        .filter(Boolean)
    ),
  ];

  let assets: {
    id: string;
    symbol: string;
    name: string;
  }[] = [];

  if (assetIds.length > 0) {
    const { data: assetData, error: assetError } =
      await supabase
        .from("assets")
        .select("id, symbol, name")
        .in("id", assetIds);

    if (assetError) {
      console.error("Orders assets error:", assetError);
    } else {
      assets = assetData ?? [];
    }
  }

  const formattedOrders: Order[] = (data ?? []).map(
    (transaction) => {
      const metadata =
        transaction.metadata &&
        typeof transaction.metadata === "object"
          ? transaction.metadata as Record<string, unknown>
          : {};

      const quantity = Number(
        metadata.quantity ?? 0
      );

      const transactionAmount = Math.abs(
        Number(transaction.amount ?? 0)
      );

      const executionPrice = Number(
        metadata.execution_price ??
          metadata.price ??
          0
      );

      const price =
        executionPrice ||
        (quantity > 0
          ? transactionAmount / quantity
          : 0);

      const asset =
        assets.find(
          (item) =>
            item.id === transaction.asset_id
        ) ?? null;

      return {
        id: transaction.id,
        side:
          transaction.transaction_type,
        status:
          transaction.status,
        quantity,
        price,
        total: transactionAmount,
        created_at:
          transaction.created_at,
        asset,
      };
    }
  );

  setOrders(formattedOrders);
}

      setLoading(false);
    };

    loadOrders();
  }, [router]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter(
          (order) =>
            order.side?.toLowerCase() ===
            filter.toLowerCase()
        );

  const formatMoney = (value: number | null) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading orders...
        </p>
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
          <div className="flex h-[76px] items-center border-b border-[#edf0ed] px-5">
            <button
              onClick={() => router.push("/account")}
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

          <div className="flex-1 overflow-y-auto px-3 py-5">

            <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Overview
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                icon={<GridIcon />}
                label="Overview"
                onClick={() => router.push("/account")}
              />

              <NavItem
                icon={<PortfolioIcon />}
                label="Portfolio"
                onClick={() =>
                  router.push("/account/portfolio")
                }
              />

              <NavItem
                icon={<MarketIcon />}
                label="Markets"
                onClick={() =>
                  router.push("/account/markets")
                }
              />

              <NavItem
                icon={<TradeIcon />}
                label="Trade"
                onClick={() =>
                  router.push("/account/trade")
                }
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Investing
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                icon={<CryptoIcon />}
                label="Crypto"
                onClick={() =>
                  router.push("/account/crypto")
                }
              />

              <NavItem
                icon={<ConvertIcon />}
                label="Convert"
                onClick={() =>
                  router.push("/account/convert")
                }
              />

              <NavItem
                icon={<StarIcon />}
                label="Watchlist"
                onClick={() =>
                  router.push("/account/watchlist")
                }
              />

              <NavItem
                icon={<OrdersIcon />}
                label="Orders"
                active
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
                onClick={() =>
                  router.push("/account/transactions")
                }
              />

              <NavItem
                icon={<TransferIcon />}
                label="Transfers"
                onClick={() =>
                  router.push("/account/transfers")
                }
              />

              <NavItem
                icon={<ChartIcon />}
                label="Analytics"
                onClick={() =>
                  router.push("/account/analytics")
                }
              />

              <NavItem
                icon={<MessageIcon />}
                label="Support"
                onClick={() =>
                  router.push("/account/support")
                }
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
                {displayName.charAt(0).toUpperCase()}
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
                    Investing
                  </p>

                  <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Orders
                  </h1>
                </div>
              </div>

              <button
                onClick={() =>
                  router.push("/account/settings")
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
              >
                {displayName.charAt(0).toUpperCase()}
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <section className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9">

            <div>
              <p className="text-sm text-[#7b857e]">
                Review your submitted investment orders.
              </p>

              <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
                Order history
              </h2>
            </div>

            {/* SUMMARY */}
            <section className="mt-7 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Total orders"
                value={orders.length.toString()}
              />

              <SummaryCard
                label="Buy orders"
                value={orders
                  .filter(
                    (order) =>
                      order.side?.toLowerCase() ===
                      "buy"
                  )
                  .length.toString()}
              />

              <SummaryCard
                label="Sell orders"
                value={orders
                  .filter(
                    (order) =>
                      order.side?.toLowerCase() ===
                      "sell"
                  )
                  .length.toString()}
              />
            </section>

            {/* ORDERS CARD */}
            <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <p className="text-xs text-[#89928b]">
                    Order activity
                  </p>

                  <h3 className="mt-1 text-lg font-semibold">
                    Your orders
                  </h3>
                </div>

                <div className="flex rounded-xl bg-[#f5f7f3] p-1">
                  {["All", "Buy", "Sell"].map(
                    (item) => (
                      <button
                        key={item}
                        onClick={() =>
                          setFilter(item)
                        }
                        className={`rounded-lg px-4 py-2 text-[9px] font-semibold transition ${
                          filter === item
                            ? "bg-white text-[#16805a] shadow-sm"
                            : "text-[#929b95]"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* TABLE */}
              <div className="mt-6 overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>
                    <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">

                      <th className="pb-3 font-semibold">
                        Asset
                      </th>

                      <th className="pb-3 font-semibold">
                        Side
                      </th>

                      <th className="pb-3 font-semibold">
                        Quantity
                      </th>

                      <th className="pb-3 font-semibold">
                        Price
                      </th>

                      <th className="pb-3 font-semibold">
                        Total
                      </th>

                      <th className="pb-3 font-semibold">
                        Status
                      </th>

                      <th className="pb-3 text-right font-semibold">
                        Date
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredOrders.map((order) => {

                      const side =
                        order.side?.toLowerCase();

                      const status =
                        order.status?.toLowerCase();

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-[#f0f2ef] last:border-0"
                        >

                          {/* ASSET */}
                          <td className="py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ef] text-[10px] font-bold text-[#16805a]">
                                {order.asset?.symbol?.slice(
                                  0,
                                  2
                                ) ?? "--"}
                              </div>

                              <div>
                                <p className="text-xs font-semibold">
                                  {order.asset?.symbol ??
                                    "Unknown"}
                                </p>

                                <p className="text-[9px] text-[#929b95]">
                                  {order.asset?.name ??
                                    "Asset"}
                                </p>
                              </div>

                            </div>
                          </td>

                          {/* SIDE */}
                          <td className="py-4">
                            <span
                              className={`rounded-md px-2 py-1 text-[9px] font-semibold ${
                                side === "sell"
                                  ? "bg-[#faeeee] text-[#c65b5b]"
                                  : "bg-[#eaf6ef] text-[#16805a]"
                              }`}
                            >
                              {side === "sell"
                                ? "SELL"
                                : "BUY"}
                            </span>
                          </td>

                          {/* QUANTITY */}
                          <td className="py-4 text-xs">
                            {Number(
                              order.quantity ?? 0
                            )}
                          </td>

                          {/* PRICE */}
                          <td className="py-4 text-xs">
                            {formatMoney(order.price)}
                          </td>

                          {/* TOTAL */}
                          <td className="py-4 text-xs font-semibold">
                            {formatMoney(order.total)}
                          </td>

                          {/* STATUS */}
                          <td className="py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                                status === "completed" ||
                                status === "filled" ||
                                status === "executed"
                                  ? "bg-[#eaf6ef] text-[#16805a]"
                                  : status === "cancelled" ||
                                      status ===
                                        "canceled" ||
                                      status === "failed"
                                    ? "bg-[#faeeee] text-[#c65b5b]"
                                    : "bg-[#f3f5f2] text-[#68736b]"
                              }`}
                            >
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="py-4 text-right text-[10px] text-[#929b95]">
                            {formatDate(
                              order.created_at
                            )}
                          </td>

                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center"
                        >
                          <div className="mx-auto flex max-w-sm flex-col items-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#16805a]">
                              <OrdersIcon />
                            </div>

                            <p className="mt-4 text-sm font-semibold">
                              No orders yet
                            </p>

                            <p className="mt-1 text-xs text-[#929b95]">
                              Your buy and sell orders
                              will appear here once
                              you place them.
                            </p>

                            <button
                              onClick={() =>
                                router.push(
                                  "/account/trade"
                                )
                              }
                              className="mt-5 rounded-xl bg-[#111613] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#242a26]"
                            >
                              Start trading
                            </button>

                          </div>
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------- */
/* HELPERS */
/* -------------------------------- */

function formatStatus(status: string) {
  if (!status) return "Pending";

  return status.charAt(0).toUpperCase() +
    status.slice(1);
}

/* -------------------------------- */
/* COMPONENTS */
/* -------------------------------- */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5 shadow-[0_10px_30px_rgba(20,35,25,0.03)]">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#8f9992]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        {value}
      </p>
    </div>
  );
}

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
/* ICONS */
/* -------------------------------- */

function GridIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="3.5"
        y="6"
        width="17"
        height="13.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 11h17"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 18V6M4 18h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m7 15 4-4 3 2 5-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 8h14M14 4l5 4-5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 16H5m5-4-5 4 5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CryptoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M10 7v10M13 7v10M9 9h4a2 2 0 1 1 0 4H9h4a2 2 0 1 1 0 4H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M7 7h10l-3-3M17 17H7l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 7v4M7 17v-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 4h12v16H6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 4h12v16l-3-2-3 2-3-2-3 2V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 8h14M15 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 16H5m4-4-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 19V5M4 19h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m7 15 3-3 3 2 5-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3v-3.5a2.5 2.5 0 0 1-1.5-2.3v-6.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 9h8M8 12h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 8l4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}