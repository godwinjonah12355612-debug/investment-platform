"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(Boolean(session));
    };

    checkSession();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8f5] text-[#111613]">
      {/* NAVBAR */}
      <header className="relative z-50 border-b border-[#e3e7e2] bg-[#f7f8f5]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* LOGO */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111613] text-xs font-black tracking-tight text-white">
              IP
            </div>

            <div>
              <div className="text-sm font-bold tracking-[-0.02em] sm:text-[15px]">
                TradeStation
              </div>

              <div className="hidden text-[9px] uppercase tracking-[0.18em] text-[#89928b] sm:block">
                Investing made clearer
              </div>
            </div>
          </a>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-9 lg:flex">
            <a
              href="/markets"
              className="text-[13px] font-medium text-[#667069] transition hover:text-[#111613]"
            >
              Markets
            </a>

            <a
              href="/platform"
              className="text-[13px] font-medium text-[#667069] transition hover:text-[#111613]"
            >
              Platform
            </a>

            <a
              href="/security"
              className="text-[13px] font-medium text-[#667069] transition hover:text-[#111613]"
            >
              Security
            </a>
          </div>

      
{/* ACTIONS */}
<div className="flex items-center gap-1.5 sm:gap-2">
  <a
    href="/login"
    className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#4e5851] transition hover:bg-white"
  >
    Log in
  </a>

  <a
    href="/signup"
    className="rounded-xl bg-[#111613] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#1b241f]"
  >
    Get started
  </a>
</div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-[1440px] overflow-hidden px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-24">
        {/* BACKGROUND GLOW */}
        <div className="pointer-events-none absolute right-[-180px] top-[-80px] h-[620px] w-[620px] rounded-full bg-[#b9dfc9]/30 blur-[140px]" />

        <div className="pointer-events-none absolute left-[-220px] top-[360px] h-[420px] w-[420px] rounded-full bg-[#dcecdf]/40 blur-[130px]" />

        <div className="relative grid items-center gap-16 lg:grid-cols-[0.88fr_1.12fr]">
          {/* LEFT */}
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce4dd] bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5d6961] shadow-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e2f1e8] text-[#16805a]">
                <SparkIcon />
              </span>

              A smarter way to invest
            </div>

            <h1 className="text-[48px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-6xl md:text-7xl lg:text-[78px]">
              Your money.
              <br />

              <span className="text-[#16805a]">Your strategy.</span>
              <br />

              Your future.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#68736b] sm:text-lg">
              Explore markets, manage your portfolio and make informed
              investment decisions with a modern financial platform built
              around clarity and control.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={isLoggedIn ? "/account" : "/signup"}
                className="group flex items-center justify-center gap-3 rounded-xl bg-[#111613] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#1b241f]"
              >
                {isLoggedIn ? "Open dashboard" : "Get started"}

                <ArrowIcon />
              </a>

              <a
                href="/markets"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#d9dfda] bg-white px-6 py-3.5 text-sm font-semibold text-[#222b25] transition hover:border-[#c6cec8] hover:bg-[#fbfcfa]"
              >
                Explore markets
              </a>
            </div>

            {/* FEATURES */}
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-[#7b857e]">
              <span className="flex items-center gap-2">
                <CheckIcon />
                Portfolio management
              </span>

              <span className="flex items-center gap-2">
                <CheckIcon />
                Market insights
              </span>

              <span className="flex items-center gap-2">
                <CheckIcon />
                Portfolio analytics
              </span>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[50px] bg-[#a9d8bc]/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[30px] border border-[#dfe5df] bg-white p-4 shadow-[0_30px_80px_rgba(24,38,29,0.12)] sm:p-5">
              {/* WINDOW HEADER */}
              <div className="flex items-center justify-between border-b border-[#edf0ed] pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#dfe5df]" />
                    <span className="h-2 w-2 rounded-full bg-[#dfe5df]" />
                    <span className="h-2 w-2 rounded-full bg-[#dfe5df]" />
                  </div>

                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b857e]">
                    Portfolio
                  </span>
                </div>

                <div className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-[9px] font-semibold text-[#16805a]">
                  LIVE VIEW
                </div>
              </div>

              {/* PORTFOLIO VALUE */}
              <div className="flex items-end justify-between gap-4 px-1 py-7">
                <div>
                  <p className="text-[11px] text-[#879089]">
                    Portfolio value
                  </p>

                  <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    $89,279.52
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#16805a]">
                      +$68.52
                    </span>

                    <span className="rounded-md bg-[#eaf6ef] px-1.5 py-0.5 font-semibold text-[#16805a]">
                      +10.05%
                    </span>
                  </div>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-[#9aa39d]">
                    Account
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#111613]">
                    Portfolio
                  </p>
                </div>
              </div>

              {/* CHART */}
              <div className="relative h-[220px] overflow-hidden rounded-2xl border border-[#edf0ed] bg-[#fafcf9] sm:h-[270px]">
                <div className="absolute inset-0">
                  {[25, 50, 75].map((position) => (
                    <div
                      key={position}
                      className="absolute left-0 right-0 border-t border-[#edf0ed]"
                      style={{ top: `${position}%` }}
                    />
                  ))}
                </div>

                <svg
                  viewBox="0 0 800 300"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="portfolioArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#16805a"
                        stopOpacity="0.18"
                      />

                      <stop
                        offset="100%"
                        stopColor="#16805a"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  <path
                    d="M0 238 C50 220 80 228 115 205 S175 210 215 180 S275 190 320 160 S380 172 425 138 S480 150 525 118 S580 130 625 95 S685 105 730 72 S770 78 800 48 L800 300 L0 300 Z"
                    fill="url(#portfolioArea)"
                  />

                  <path
                    d="M0 238 C50 220 80 228 115 205 S175 210 215 180 S275 190 320 160 S380 172 425 138 S480 150 525 118 S580 130 625 95 S685 105 730 72 S770 78 800 48"
                    fill="none"
                    stroke="#16805a"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                  />

                  <circle
                    cx="800"
                    cy="48"
                    r="7"
                    fill="#16805a"
                  />
                </svg>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[9px] text-[#a1aaa4]">
                  <span>JUN</span>
                  <span>JUL</span>
                  <span>AUG</span>
                  <span>SEP</span>
                  <span>NOW</span>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniCard label="Stocks" value="0.8%" />
                <MiniCard label="USD Cash" value="98.6%" />
                <MiniCard label="EUR Cash" value="0.6%" />
                <MiniCard label="Return" value="10.05%" />
              </div>
            </div>

            {/* FLOATING CARD */}
            <div className="absolute -bottom-7 -left-3 hidden rounded-2xl border border-[#dfe5df] bg-white p-4 shadow-[0_20px_45px_rgba(20,35,25,0.12)] sm:block md:-left-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f4eb] text-[#16805a]">
                  <TrendIcon />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#9aa39d]">
                    Portfolio return
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-[#16805a]">
                    +10.05%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / VALUE STRIP */}
      <section className="border-y border-[#dfe4df] bg-white">
        <div className="mx-auto grid max-w-[1440px] sm:grid-cols-3">
          <ValueCard
            number="01"
            title="Understand markets"
            description="Follow assets, prices and market movements from one clear workspace."
          />

          <ValueCard
            number="02"
            title="Build your portfolio"
            description="Track positions, cash balances and investment performance in one place."
          />

          <ValueCard
            number="03"
            title="Make informed decisions"
            description="Use analytics and portfolio insights to better understand your strategy."
          />
        </div>
      </section>

      {/* PLATFORM SECTION */}
      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#16805a]">
              Built around your portfolio
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Everything you need in one investment workspace.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-6 text-[#737d76]">
              Keep your investments, market information, transactions and
              portfolio analytics organized in a single experience.
            </p>

            <a
              href="/platform"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#111613] transition hover:text-[#16805a]"
            >
              Explore the platform
              <ArrowIcon />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureCard
              icon={<ChartIcon />}
              title="Portfolio analytics"
              description="Understand allocation, performance and profit or loss."
            />

            <FeatureCard
              icon={<MarketIcon />}
              title="Market overview"
              description="Monitor assets and follow price movements."
            />

            <FeatureCard
              icon={<WalletIcon />}
              title="Portfolio management"
              description="Keep track of positions and available cash."
            />

            <FeatureCard
              icon={<ShieldIcon />}
              title="Account security"
              description="Manage your account with a security-focused architecture."
            />
          </div>
        </div>
      </section>
      {/* TESTIMONIALS */}
<section className="border-y border-[#dfe4df] bg-white">
  <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#16805a]">
          Investor perspectives
        </p>

        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Built for a clearer investing journey.
        </h2>

        <p className="mt-5 max-w-xl text-sm leading-6 text-[#737d76]">
          Discover how investors approach portfolio building,
          diversification, market research and long-term investing.
        </p>
      </div>
    </div>

    <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=12"
        quote="I have a much clearer view of my investments now. Being able to track my portfolio performance helps me stay focused on my long-term strategy."
        name="Daniel Carter"
      />

      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=47"
        quote="Diversification became much easier for me to understand once I could see how each investment affected the overall balance of my portfolio."
        name="Maya Thompson"
      />

      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=11"
        quote="I like being able to research market movements and then look at my own portfolio before making an investment decision."
        name="Ethan Brooks"
      />

      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=49"
        quote="Investing used to feel complicated. Having everything organized in one place has helped me become more disciplined with my strategy."
        name="Sofia Williams"
      />

      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=68"
        quote="The performance information helps me understand what is working in my portfolio and where I may need to reconsider my allocation."
        name="Marcus Reed"
      />

      <TestimonialCard
        avatar="https://i.pravatar.cc/160?img=44"
        quote="I am much more comfortable thinking about investing as a long-term process instead of reacting to every short-term market movement."
        name="Olivia Bennett"
      />
    </div>

    <div className="mt-10 flex justify-center">
      <a
        href="/testimonials"
        className="inline-flex items-center gap-2 rounded-xl border border-[#d9dfda] bg-white px-6 py-3 text-sm font-semibold text-[#222b25] transition hover:border-[#c6cec8] hover:bg-[#fbfcfa]"
      >
        View all testimonials
        <ArrowIcon />
      </a>
    </div>
  </div>
</section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12">
        <div className="relative overflow-hidden rounded-[30px] bg-[#111613] px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="absolute right-[-100px] top-[-140px] h-[380px] w-[380px] rounded-full bg-[#16805a]/30 blur-[100px]" />

          <div className="relative max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#76b99b]">
              TradeStation
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Build a clearer view of your investments.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#aeb8b1]">
              Explore the platform, review markets and start building your
              investment strategy.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={isLoggedIn ? "/account" : "/signup"}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#111613] transition hover:bg-[#eef3ed]"
              >
                {isLoggedIn ? "Open dashboard" : "Get started"}
                <ArrowIcon />
              </a>

              <a
                href="/markets"
                className="flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Explore markets
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#dfe4df] bg-[#f7f8f5]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111613] text-[10px] font-black text-white">
                  IP
                </div>

                <span className="text-sm font-bold">
                  TradeStation
                </span>
              </div>

              <p className="mt-4 max-w-sm text-[11px] leading-5 text-[#89928b]">
                A modern investment workspace designed to make portfolio
                management and market information easier to understand.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-[11px] text-[#737d76] sm:grid-cols-3">
              <a href="/markets" className="hover:text-[#111613]">
                Markets
              </a>

              <a href="/platform" className="hover:text-[#111613]">
                Platform
              </a>

              <a href="/security" className="hover:text-[#111613]">
                Security
              </a>

              <a href="/" className="hover:text-[#111613]">
                Home
              </a>

              <a href="#" className="hover:text-[#111613]">
                Privacy
              </a>

              <a href="#" className="hover:text-[#111613]">
                Contact
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-[#edf0ed] pt-6 text-[9px] uppercase tracking-[0.1em] text-[#9aa29c] sm:flex-row">
            <span>© 2026 TradeStation</span>

            <span>Investment workspace</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ----------------------------- */
/* VALUE CARD */
/* ----------------------------- */

function ValueCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#e5e9e4] p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className="text-[10px] font-medium text-[#a0a9a2]">
        {number}
      </span>

      <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[#737d76]">
        {description}
      </p>
    </div>
  );
}

/* ----------------------------- */
/* FEATURE CARD */
/* ----------------------------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(20,35,25,0.06)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5ef] text-[#16805a]">
        {icon}
      </div>

      <h3 className="mt-5 text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#7b857e]">
        {description}
      </p>
    </div>
  );
}
/* ----------------------------- */
/* TESTIMONIAL CARD */
/* ----------------------------- */

function TestimonialCard({
  avatar,
  quote,
  name,
}: {
  avatar: string;
  quote: string;
  name: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-[#fbfcfa] p-6 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_15px_40px_rgba(20,35,25,0.06)]">
      <div className="flex items-start gap-4">
        <img
          src={avatar}
          alt=""
          className="h-14 w-14 rounded-full object-cover ring-4 ring-[#eef3ee]"
        />

        <div className="pt-1">
          <p className="text-sm font-semibold text-[#111613]">
            {name}
          </p>

          <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#929b95]">
            Individual investor
          </p>

          <div className="mt-2 flex gap-0.5 text-[13px] text-[#16805a]">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-[#4f5a53]">
        “{quote}”
      </p>
    </div>
  );
}

/* ----------------------------- */
/* MINI CARD */
/* ----------------------------- */

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#edf0ed] bg-[#fbfcfa] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] text-[#929b95]">
          {label}
        </span>

        <span className="text-[9px] font-semibold text-[#16805a]">
          {value}
        </span>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e9eee9]">
        <div
          className="h-full rounded-full bg-[#16805a]"
          style={{
            width:
              label === "Return"
                ? "82%"
                : label === "Stocks"
                  ? "8%"
                  : label === "EUR Cash"
                    ? "6%"
                    : "99%",
          }}
        />
      </div>
    </div>
  );
}

/* ----------------------------- */
/* ICONS */
/* ----------------------------- */

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 17 10 11l4 4 6-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 7h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="17"
      height="17"
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
        d="m7 15 3-4 3 2 5-7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 19V9M12 19V5M19 19v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 13h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}