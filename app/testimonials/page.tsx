
import Link from "next/link";

const testimonials = [
  {
    avatar: "https://i.pravatar.cc/160?img=12",
    name: "Daniel Carter",
    quote:
      "I have a much clearer view of my investments now. Being able to track my portfolio performance helps me stay focused on my long-term strategy.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=47",
    name: "Maya Thompson",
    quote:
      "Diversification became much easier for me to understand once I could see how each investment affected the overall balance of my portfolio.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=11",
    name: "Ethan Brooks",
    quote:
      "I like being able to research market movements and then look at my own portfolio before making an investment decision.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=49",
    name: "Sofia Williams",
    quote:
      "Investing used to feel complicated. Having everything organized in one place has helped me become more disciplined with my strategy.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=68",
    name: "Marcus Reed",
    quote:
      "The performance information helps me understand what is working in my portfolio and where I may need to reconsider my allocation.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=44",
    name: "Olivia Bennett",
    quote:
      "I am much more comfortable thinking about investing as a long-term process instead of reacting to every short-term market movement.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=3",
    name: "Liam Foster",
    quote:
      "Having my investments clearly organized makes it easier to review my allocation and stay consistent with the strategy I have set for myself.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=5",
    name: "Chloe Anderson",
    quote:
      "I find it much easier to compare the different investments in my portfolio and understand how they contribute to my overall position.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=8",
    name: "Benjamin Scott",
    quote:
      "The biggest improvement for me has been having a clearer picture of my portfolio rather than relying on scattered information from different places.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=9",
    name: "Isabella Martin",
    quote:
      "I have become more intentional about diversification because I can see how my investments are distributed across my portfolio.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=13",
    name: "Nathan Walker",
    quote:
      "Reviewing my portfolio regularly has helped me make more thoughtful investment decisions instead of reacting emotionally to market movements.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=20",
    name: "Harper Lewis",
    quote:
      "I appreciate being able to focus on my investment goals while still keeping track of performance and changes in my portfolio.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=33",
    name: "Alexander Hall",
    quote:
      "Seeing portfolio performance alongside my holdings gives me a better understanding of where my capital is working and where I can improve.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=32",
    name: "Emily Young",
    quote:
      "Investing feels more structured for me now. I can review my holdings, think about my allocation and stay focused on the bigger picture.",
  },
];

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f3] text-[#111613]">
      {/* HEADER */}
      <header className="border-b border-[#dfe5df] bg-[#f5f7f3]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111613] text-xs font-bold text-white">
              I
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">
                Investment Platform
              </p>

              <p className="text-[9px] uppercase tracking-[0.12em] text-[#929b95]">
                Investment workspace
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9dfda] bg-white px-4 py-2.5 text-xs font-semibold text-[#222b25] transition hover:border-[#c6cec8] hover:bg-[#fbfcfa]"
          >
            <BackIcon />
            Back to home
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-[#dfe5df] bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#16805a]">
              Investor perspectives
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              A clearer way to approach investing.
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#737d76] sm:text-base">
              Explore perspectives on portfolio management,
              diversification, investment research, performance
              tracking and long-term investing.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs text-[#89928b]">
                Investment experiences
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Investor perspectives
              </h2>
            </div>

            <p className="text-[10px] uppercase tracking-[0.1em] text-[#9aa39d]">
              14 perspectives
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.name}
                avatar={testimonial.avatar}
                name={testimonial.name}
                quote={testimonial.quote}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#dfe5df] bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 text-center sm:px-8 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#16805a]">
            Your investment journey
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Build a portfolio you can understand.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#737d76]">
            Keep your investments organized, understand your
            allocation and stay focused on your long-term goals.
          </p>

          <div className="mt-7">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#111613] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#202721]"
            >
              Back to home
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#dfe5df] bg-[#f5f7f3]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-7 text-[10px] text-[#929b95] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>
            © {new Date().getFullYear()} Investment Platform
          </p>

          <p>Invest with clarity. Build with intention.</p>
        </div>
      </footer>
    </main>
  );
}

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
    <article className="rounded-2xl border border-[#dfe5df] bg-white p-6 shadow-[0_10px_30px_rgba(20,35,25,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(20,35,25,0.06)]">
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

          <div
            className="mt-2 flex gap-0.5 text-[13px] text-[#16805a]"
            aria-label="5 star rating"
          >
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
    </article>
  );
}

function BackIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
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

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
