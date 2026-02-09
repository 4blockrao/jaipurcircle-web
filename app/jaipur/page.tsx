import Link from "next/link";

export default function JaipurIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Jaipur</h1>
      <p className="mt-3 text-neutral-300">
        Browse locality guides and what’s happening across the city.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-medium">Start here</h2>
        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          <li><Link className="underline" href="/localities">All localities</Link></li>
          <li><Link className="underline" href="/events">All events</Link></li>
        </ul>
      </div>

      <div className="mt-8 text-xs text-neutral-500">
        FILE-FINGERPRINT: jaipur-index-v1
      </div>
    </main>
  );
}
