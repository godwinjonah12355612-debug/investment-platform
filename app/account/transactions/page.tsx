"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Transaction = {
  id: string;
  transaction_type: string;
  status: string;
  asset_id: string | null;
  currency: string | null;
  amount: number;
  fee: number;
  reference: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const transactionTypes = [
  "All",
  "Deposit",
  "Withdrawal",
  "Buy",
  "Sell",
];

const transactionStatuses = [
  "All",
  "Completed",
  "Pending",
  "Failed",
  "Cancelled",
];

export default function TransactionsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, transaction_type, status, asset_id, currency, amount, fee, reference, description, metadata, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Transactions error:", error);
        setTransactions([]);
      } else {
        setTransactions((data ?? []) as Transaction[]);
      }

      setLoading(false);
    };

    loadTransactions();
  }, [router]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "All" ||
        transaction.transaction_type.toLowerCase() ===
          typeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        transaction.status.toLowerCase() ===
          statusFilter.toLowerCase();

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        transaction.transaction_type
          .toLowerCase()
          .includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        (transaction.description ?? "")
          .toLowerCase()
          .includes(query) ||
        (transaction.reference ?? "")
          .toLowerCase()
          .includes(query) ||
        (transaction.currency ?? "")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading transactions...
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
                Transactions
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
      <section className="mx-auto max-w-[1300px] px-5 py-8 sm:px-7 lg:px-9">
        <div>
          <p className="text-sm text-[#7b857e]">
            Review your account activity and transaction history.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Activity
          </h2>
        </div>

        {/* FILTERS */}
        <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa39d]">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="h-11 w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] pl-11 pr-4 text-xs outline-none transition placeholder:text-[#a0a8a2] focus:border-[#16805a] focus:ring-4 focus:ring-[#16805a]/10"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-medium text-[#58635b] outline-none"
              >
                {transactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-medium text-[#58635b] outline-none"
              >
                {transactionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* TRANSACTIONS */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#89928b]">
                Account activity
              </p>

              <h3 className="mt-1 text-lg font-semibold">
                Transactions
              </h3>
            </div>

            <span className="text-[10px] text-[#929b95]">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1
                ? "transaction"
                : "transactions"}
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#edf0ed] text-left text-[9px] uppercase tracking-[0.1em] text-[#9aa39d]">
                  <th className="pb-3 font-semibold">
                    Date
                  </th>

                  <th className="pb-3 font-semibold">
                    Type
                  </th>

                  <th className="pb-3 font-semibold">
                    Description
                  </th>

                  <th className="pb-3 font-semibold">
                    Reference
                  </th>

                  <th className="pb-3 font-semibold">
                    Amount
                  </th>

                  <th className="pb-3 font-semibold">
                    Fee
                  </th>

                  <th className="pb-3 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[#f0f2ef] last:border-0"
                  >
                    <td className="py-4">
                      <p className="text-xs font-medium">
                        {formatDate(transaction.created_at)}
                      </p>

                      <p className="mt-1 text-[9px] text-[#929b95]">
                        {formatTime(transaction.created_at)}
                      </p>
                    </td>

                   <td className="py-4">
  <span className="rounded-lg bg-[#f4f6f3] px-2.5 py-1.5 text-[9px] font-semibold text-[#58635b]">
    {formatType(transaction.transaction_type)}
  </span>
</td>

                    <td className="py-4">
                      <p className="max-w-[260px] truncate text-xs font-medium">
                        {transaction.description ||
                          `${formatType(
                            transaction.transaction_type
                          )} transaction`}
                      </p>
                    </td>

                    <td className="py-4">
                      <span className="text-[10px] text-[#7b857e]">
                        {transaction.reference || "—"}
                      </span>
                    </td>

                    <td className="py-4 text-xs font-semibold">
                      {formatTransactionAmount(
                        transaction.amount,
                        transaction.currency
                      )}
                    </td>

                    <td className="py-4 text-xs text-[#7b857e]">
                      {formatTransactionAmount(
                        transaction.fee,
                        transaction.currency
                      )}
                    </td>

                    <td className="py-4">
                      <StatusBadge
                        status={transaction.status}
                      />
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#16805a]">
                        <ReceiptIcon />
                      </div>

                      <p className="mt-4 text-sm font-semibold">
                        No transactions found
                      </p>

                      <p className="mt-1 text-xs text-[#929b95]">
                        Your account activity will appear here.
                      </p>
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

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const className =
    normalized === "completed"
      ? "bg-[#eaf6ef] text-[#16805a]"
      : normalized === "pending"
        ? "bg-[#fff6df] text-[#a97812]"
        : normalized === "failed"
          ? "bg-[#faeeee] text-[#c65b5b]"
          : "bg-[#f2f4f2] text-[#727c75]";

  return (
    <span
      className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${className}`}
    >
      {formatType(status)}
    </span>
  );
}

function formatType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTransactionAmount(
  amount: number,
  currency: string | null
) {
  const value = Number(amount ?? 0);
  const symbol = currency ?? "USD";

  if (["BTC", "ETH", "SOL"].includes(symbol)) {
    return `${value.toLocaleString("en-US", {
      maximumFractionDigits: 8,
    })} ${symbol}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: symbol,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} ${symbol}`;
  }
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

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function ReceiptIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}