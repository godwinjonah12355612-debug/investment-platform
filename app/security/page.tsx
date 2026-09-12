import Navbar from "@/components/Navbar";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#202522]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">

        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-black/50">
            Security
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Built with security in mind.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-black/55">
            Security is designed into the platform architecture, from account
            authentication to access controls and protection of user data.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2">

          {[
            ["Secure Authentication", "User authentication will protect access to private account areas."],
            ["Account Protection", "Private account information is separated from public platform content."],
            ["Access Controls", "Database-level permissions can restrict users to the information they are authorized to access."],
            ["Data Protection", "Sensitive platform data should be protected through appropriate security controls and secure infrastructure."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{title}</h2>

              <p className="mt-4 text-sm leading-7 text-black/55">
                {text}
              </p>
            </div>
          ))}

        </div>

      </section>
    </main>
  );
}