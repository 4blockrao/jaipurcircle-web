// app/localities/[slug]/page.tsx
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default function LocalityRedirectPage({
  params,
}: {
  params: { slug?: string };
}) {
  const slug = params?.slug;
  if (!slug) redirect("/localities");
  redirect(`/jaipur/${slug}`);
}
