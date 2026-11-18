"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageIntro } from "@/components/PageIntro";
import { href } from "@/components/paths";
import { getDictionary } from "@/i18n/dictionaries";

export default function NotFound() {
  const pathname = usePathname() || "";
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const d = getDictionary(locale).notFound;
  return (
    <>
      <PageIntro title={d.title} lead={d.text} />
      <section className="section section--after-intro">
        <div className="container">
          <Link className="btn btn--primary" href={href(locale, "home")}>
            {d.back}
          </Link>
        </div>
      </section>
    </>
  );
}
