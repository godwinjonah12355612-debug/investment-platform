
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function SendMoneyPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingRecipient, setCheckingRecipient] =
    useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientFound, setRecipientFound] =
    useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      setUser(session.user);

      const { data: cashBalance, error } =
        await supabase
          .from("cash_balances")
          .select("available_balance")
          .eq("user_id", session.user.id)
          .eq("currency", "USD")
          .maybeSingle();

      if (error) {
        console.error(
          "Send money balance error:",
          error
        );
      } else {
        setBalance(
          Number(
            cashBalance?.available_balance ?? 0
          )
        );
      }

      setLoading(false);
    };

    loadAccount();
  }, [router]);

  const handleCheckRecipient = async () => {
    setMessage("");
    setRecipientName("");
    setRecipientFound(false);

    const trimmedAccountNumber =
      accountNumber.trim().toUpperCase();

    if (!trimmedAccountNumber) {
      setMessage(
        "Please enter the recipient account number."
      );
      return;
    }

    setCheckingRecipient(true);

    const supabase = createClient();

    const { data: recipient, error } =
      await supabase
        .from("profiles")
        .select("id, full_name, account_number")
        .eq(
          "account_number",
          trimmedAccountNumber
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Recipient lookup error:",
        error
      );

      setMessage(
        "Unable to verify this account number."
      );
    } else if (!recipient) {
      setMessage(
        "No Investment Platform account was found with that account number."
      );
    } else if (recipient.id === user?.id) {
      setMessage(
        "You cannot send money to your own account."
      );
    } else {
      setRecipientName(
        recipient.full_name || "Investment Platform user"
      );
      setRecipientFound(true);
    }

    setCheckingRecipient(false);
  };

  const handleSendMoney = async () => {
  setMessage("");

  const numericAmount = Number(amount);

  if (!recipientFound) {
    setMessage("Please verify the recipient first.");
    return;
  }

  if (!numericAmount || numericAmount <= 0) {
    setMessage("Please enter a valid amount.");
    return;
  }

  if (numericAmount > balance) {
    setMessage("Insufficient available USD balance.");
    return;
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "send_money",
    {
      recipient_account_number:
        accountNumber.trim().toUpperCase(),
      transfer_amount: numericAmount,
    }
  );

  if (error) {
    console.error("Send money error:", error);
    setMessage(error.message);
    return;
  }

  if (!data?.success) {
    setMessage("The transfer could not be completed.");
    return;
  }

  setBalance((currentBalance) =>
    currentBalance - numericAmount
  );

  setAmount("");
  setAccountNumber("");
  setRecipientName("");
  setRecipientFound(false);

  setMessage(
    `Transfer completed successfully. Reference: ${data.reference}`
  );
};
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Investor";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <p className="text-sm text-[#68736b]">
          Loading send money...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      <header className="sticky top-0 z-30 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1100px] items-center justify-between px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push("/account/transfers")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe5df] bg-white text-[#69736c] transition hover:text-[#111613]"
              aria-label="Back"
            >
              <BackIcon />
            </button>

            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                Transfers
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                Send Money
              </h1>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[760px] px-5 py-8 sm:px-7">
        <div>
          <p className="text-sm text-[#7b857e]">
            Send USD to another TradeStation user.
          </p>

          <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
            Send money
          </h2>
        </div>

        {/* BALANCE */}
        <section className="mt-7 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#8f9992]">
            Available balance
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {formatCurrency(balance)}
          </p>

          <p className="mt-1 text-[10px] text-[#929b95]">
            Available USD
          </p>
        </section>

        {/* RECIPIENT */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <p className="text-xs text-[#89928b]">
            Recipient
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Investment account
          </h3>

          <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
            Account number
          </label>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              value={accountNumber}
              onChange={(event) => {
                setAccountNumber(
                  event.target.value.toUpperCase()
                );
                setRecipientFound(false);
                setRecipientName("");
                setMessage("");
              }}
              placeholder="INV-2026-00000000"
              className="min-w-0 flex-1 rounded-xl border border-[#dfe5df] bg-[#fbfcfa] px-4 py-3 text-sm font-medium tracking-[0.03em] outline-none transition focus:border-[#16805a] focus:bg-white"
            />

            <button
              type="button"
              onClick={handleCheckRecipient}
              disabled={checkingRecipient}
              className="rounded-xl bg-[#111613] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#242a26] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingRecipient
                ? "Checking..."
                : "Verify"}
            </button>
          </div>

          {recipientFound && (
            <div className="mt-4 rounded-2xl border border-[#dcefe4] bg-[#f4fbf6] p-4">
              <p className="text-[9px] uppercase tracking-[0.1em] text-[#16805a]">
                Recipient verified
              </p>

              <p className="mt-1 text-sm font-semibold">
                {recipientName}
              </p>

              <p className="mt-1 text-[9px] text-[#929b95]">
                This account is ready to receive your transfer.
              </p>
            </div>
          )}
        </section>

        {/* AMOUNT */}
        <section className="mt-5 rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
          <p className="text-xs text-[#89928b]">
            Transfer amount
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            How much would you like to send?
          </h3>

          <label className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f9992]">
            Amount in USD
          </label>

          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#929b95]">
              $
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              placeholder="0.00"
              className="w-full rounded-xl border border-[#dfe5df] bg-[#fbfcfa] py-3 pl-9 pr-4 text-lg font-semibold outline-none transition focus:border-[#16805a] focus:bg-white"
            />
          </div>

          <div className="mt-3 flex justify-between text-[9px] text-[#929b95]">
            <span>Available</span>

            <span>
              {formatCurrency(balance)}
            </span>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-[#e5cccc] bg-[#fffafa] px-4 py-3 text-xs text-[#c65b5b]">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleSendMoney}
            className="mt-5 w-full rounded-xl bg-[#16805a] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#126b4b]"
          >
            Review transfer
          </button>
        </section>

        {/* NOTICE */}
        <div className="mt-5 rounded-2xl border border-[#edf0ed] bg-white p-4">
          <p className="text-[10px] font-semibold">
            Before you send
          </p>

          <p className="mt-1 text-[9px] leading-5 text-[#929b95]">
            Verify the recipient account number carefully.
            Transfers between TradeStation users should
            only be sent to the intended recipient.
          </p>
        </div>
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
