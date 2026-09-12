import Navbar from "@/components/Navbar";

const features = [
  {
    title: "Paper Trading",
    text: "Practice buying and selling assets using simulated funds without risking real money.",
  },
  {
    title: "Portfolio Management",
    text: "Build and monitor simulated portfolios while learning how different assets affect performance.",
  },
  {
    title: "Investment Goals",
    text: "Create educational investment goals and track simulated progress toward them.",
  },
  {
    title: "Recurring Investments",
    text: "Explore how recurring contributions could affect a portfolio over time through simulation.",
  },
  {
    title: "Activity Tracking",
    text: "Review simulated orders, transfers and portfolio activity in one organized place.",
  },
  {
    title: "Account Management",
    text: "Manage your simulated investment profile and platform preferences.",
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#202522]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">

        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-black/50">
            Platform
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Learn by doing.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-black/55">
            A practical investment simulation platform where you can explore
            portfolios, trading strategies and investment concepts without
            using real money.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {feature.title}
              </h2>

              <p className="mt-4 text-sm leading-7 text-black/55">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

      </section>
    </main>
  );
}