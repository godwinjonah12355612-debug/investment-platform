"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function SupportPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [sidebarOpen, setSidebarOpen] = useState(false);

const [category, setCategory] = useState("General");
const [subject, setSubject] = useState("");
const [message, setMessage] = useState("");
const [supportMessages, setSupportMessages] = useState<any[]>([]);
  useEffect(() => {
  const supabase = createClient();

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

   console.log(
  "SUPPORT USER ID:",
  session.user.id
);
    setUser(session.user);
    setLoading(false);
  };

  checkUser();
}, [router]);

useEffect(() => {
  if (!user) return;

  const loadSupportMessages = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
  .from("support_messages")
  .select(`
    id,
    ticket_id,
    sender_type,
    message,
    created_at
  `)
  .order("created_at", {
    ascending: true,
  });
    if (error) {
      console.error(
        "Error loading support messages:",
        error
      );
      return;
    }

    setSupportMessages(data ?? []);
  };

  loadSupportMessages();

  const interval = setInterval(() => {
    loadSupportMessages();
  }, 3000);

  return () => {
    clearInterval(interval);
  };
}, [user?.id]);

const handleLogout = async () => {
  const supabase = createClient();

  await supabase.auth.signOut();

  router.replace("/login");
  router.refresh();
};

const handleSubmit = async () => {
  if (!user) return;

  if (!subject.trim() || !message.trim()) {
    return;
  }

  const supabase = createClient();

  const { data: ticket, error: ticketError } =
    await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
      })
      .select("id")
      .single();

  if (ticketError) {
    console.error(
      "Error creating support ticket:",
      ticketError
    );
    return;
  }

  const { error: messageError } =
    await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "customer",
        message: message.trim(),
      });

  if (messageError) {
    console.error(
      "Error creating support message:",
      messageError
    );
    return;
  }

  const telegramMessage = [
    "🎫 NEW SUPPORT TICKET",
    "",
    `Ticket ID: ${ticket.id}`,
    `Customer: ${user.email ?? "Unknown"}`,
    `Category: ${category}`,
    `Subject: ${subject.trim()}`,
    "",
    "Message:",
    message.trim(),
    "",
    "Reply to this ticket from Telegram.",
  ].join("\n");

  try {
    const telegramResponse = await fetch(
      "/api/support/telegram",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: telegramMessage,
        }),
      }
    );

    const telegramData =
      await telegramResponse.json();

    if (
      !telegramResponse.ok ||
      !telegramData.success
    ) {
      console.error(
        "Telegram notification failed:",
        telegramData
      );
    }
  } catch (error) {
    console.error(
      "Telegram notification error:",
      error
    );
  }

  setSubject("");
  setMessage("");

  console.log(
    "SUPPORT TICKET CREATED:",
    ticket.id
  );
};


  if (loading && !user) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
      <div className="text-sm text-[#68736b]">Loading...</div>
    </main>
  );
}

  const displayName =
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "Investor";

console.log("SUPPORT PAGE RENDERING");

return (
    
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
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
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[76px] items-center border-b border-[#edf0ed] px-5">
            <button
              onClick={() => router.push("/account")}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-black text-white">
                IP
              </div>

              <div className="text-left">
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
                label="Overview"
                onClick={() => router.push("/account")}
              />

              <NavItem
                label="Portfolio"
                onClick={() => router.push("/account/portfolio")}
              />

              <NavItem
                label="Markets"
                onClick={() => router.push("/account/markets")}
              />

              <NavItem
                label="Trade"
                onClick={() => router.push("/account/trade")}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Investing
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                label="Crypto"
                onClick={() => router.push("/account/crypto")}
              />

              <NavItem
                label="Convert"
                onClick={() => router.push("/account/convert")}
              />

              <NavItem
                label="Watchlist"
                onClick={() => router.push("/account/watchlist")}
              />

              <NavItem
                label="Orders"
                onClick={() => router.push("/account/orders")}
              />
            </nav>

            <p className="mt-7 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
              Activity
            </p>

            <nav className="mt-2 space-y-1">
              <NavItem
                label="Transactions"
                onClick={() => router.push("/account/transactions")}
              />

              <NavItem
                label="Transfers"
                onClick={() => router.push("/account/transfers")}
              />

              <NavItem
                label="Analytics"
                onClick={() => router.push("/account/analytics")}
              />

              <NavItem
                label="Support"
                active
                onClick={() => router.push("/account/support")}
              />
            </nav>
          </div>

          <div className="border-t border-[#edf0ed] p-3">
            <button
              onClick={() => router.push("/account/settings")}
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

              <span className="text-[#909991]">›</span>
            </button>

            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#69736c] transition hover:bg-[#f5f7f3] hover:text-[#111613]"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#dfe5df] bg-[#f5f7f3]/90 backdrop-blur">
            <div className="flex h-[76px] items-center justify-between px-4 sm:px-7 lg:px-9">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl border border-[#dfe5df] bg-white p-2.5 lg:hidden"
                  aria-label="Open navigation"
                >
                  ☰
                </button>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#9aa39d]">
                    Help & Support
                  </p>

                  <h1 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    Customer Support
                  </h1>
                </div>
              </div>

              <button
                onClick={() => router.push("/account/settings")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white"
              >
                {displayName.charAt(0).toUpperCase()}
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-7 lg:px-9">
            {/* Support content will go here */}
           
           <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
  <div className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
        Customer Support
      </p>

      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
        How can we help?
      </h2>

      <p className="mt-2 max-w-xl text-sm leading-6 text-[#68736b]">
        Send us a message and our support team will get back to you.
      </p>
    </div>

    <div className="mt-7 space-y-5">
      <div>
        <label className="text-xs font-semibold text-[#303731]">
          Category
        </label>

        <select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#16805a]"
>
          <option>General</option>
          <option>Account</option>
          <option>Deposits</option>
          <option>Withdrawals</option>
          <option>Trading</option>
          <option>Portfolio</option>
          <option>Technical Issue</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#303731]">
          Subject
        </label>

        <input
  type="text"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
  placeholder="What do you need help with?"
  className="mt-2 w-full rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#a0a8a2] focus:border-[#16805a]"
/>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#303731]">
          Message
        </label>
<textarea
  rows={7}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder="Tell us what happened..."
  className="mt-2 w-full resize-none rounded-xl border border-[#dfe5df] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#a0a8a2] focus:border-[#16805a]"
/>
      </div>

      <button
  type="button"
  onClick={handleSubmit}
  className="w-full rounded-xl bg-[#111613] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16805a] sm:w-auto"
>
  Send message
</button>
    </div>
    </div>

  {/* SUPPORT CONVERSATION */}
  <div className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
      Conversation
    </p>

    <h3 className="mt-2 text-base font-semibold">
      Support messages
    </h3>

    <div className="mt-5 space-y-3">
      {supportMessages.length === 0 ? (
        <p className="text-sm text-[#929b95]">
          No messages yet.
        </p>
      ) : (
        supportMessages.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl p-4 ${
              item.sender_type === "customer"
                ? "bg-[#f5f7f3]"
                : "bg-[#eaf6ef]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                {item.sender_type === "customer"
                  ? "You"
                  : "Support"}
              </p>

              <p className="text-[9px] text-[#929b95]">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4f5952]">
              {item.message}
            </p>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="rounded-3xl border border-[#dfe5df] bg-white p-5 shadow-[0_12px_35px_rgba(20,35,25,0.04)] sm:p-6">
    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9aa39d]">
      Support
    </p>

    <h3 className="mt-2 text-base font-semibold">
      Need help?
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#68736b]">
      Your support requests and replies will appear here once you contact our team.
    </p>

    <div className="mt-6 rounded-2xl bg-[#f5f7f3] p-4">
      <p className="text-xs font-semibold text-[#303731]">
        Support hours
      </p>

      <p className="mt-1 text-xs leading-5 text-[#68736b]">
        Our support team is available to assist with your account and investments.
      </p>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function NavItem({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-xs transition ${
        active
          ? "bg-[#e7f2eb] font-semibold text-[#16805a]"
          : "text-[#68736b] hover:bg-[#f5f7f3] hover:text-[#111613]"
      }`}
    >
      {label}
    </button>
  );
}