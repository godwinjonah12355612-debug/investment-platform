import Navbar from "@/components/Navbar";

export default function MarketsPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#202522]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="max-w-3xl">

          <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-black/50">
            Markets
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Explore the markets.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-black/55">
            Explore stocks, ETFs and other market assets in an educational
            environment designed to help you understand how markets work.
          </p>

        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">

          {[
            ["S&P 500", "5,842.16", "+0.82%"],
            ["NASDAQ", "18,421.33", "+1.14%"],
            ["Dow Jones", "42,618.77", "+0.41%"],
          ].map(([name, price, change]) => (
            <div
              key={name}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm"
            >
              <p className="text-sm text-black/45">{name}</p>

              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {price}
              </p>

              <p className="mt-2 text-sm font-medium text-[#15966b]">
                {change}
              </p>
            </div>
          ))}

        </div>
      </section>
    </main>
  );
}