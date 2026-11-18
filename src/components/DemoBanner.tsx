import { fill } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function DemoBanner({ dict, author }: { dict: Dictionary["demo"]; author: string }) {
  return (
    <div className="demo-banner" role="note">
      <p className="container demo-banner__inner">
        <strong>{dict.text}</strong>
        {author ? ` ${fill(dict.by, { author })}.` : "."}{" "}
        <span className="demo-banner__note">{dict.note}</span>
      </p>
    </div>
  );
}
