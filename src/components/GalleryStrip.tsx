import { tr, type GalleryItem } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { formatTime, toMinutes } from "@/lib/time";

/** Le ciel de Gammarth à une heure donnée : sert de fond tant qu'il n'y a pas de photo. */
function skyAt(hhmm: string): string {
  const m = toMinutes(hhmm);
  if (m >= 17 * 60 && m < 19 * 60) {
    return "linear-gradient(180deg, #2f6fb3 0%, #8e5f8e 42%, #ff9a3c 62%, #ffc36b 64%, #6b3a5a 64.2%, #1d2552 100%)";
  }
  if (m >= 19 * 60 && m < 20 * 60) {
    return "radial-gradient(circle 2.75rem at 58% 64%, #ffe1a8 0%, #ffb04a 55%, #ff8a1f 98%, transparent 100%), linear-gradient(180deg, #1d2552 0%, #5a2f63 30%, #c64b6c 52%, #ff8a1f 64%, #5a2f5a 64.2%, #1a1c45 100%)";
  }
  if (m >= 20 * 60 && m < 22 * 60) {
    return "linear-gradient(180deg, #0e2340 0%, #2a1f4c 36%, #6a2b5d 56%, #c2456b 64%, #2a1d46 64.2%, #10183a 100%)";
  }
  if (m >= 22 * 60 || m < 0.5 * 60) {
    return "radial-gradient(40% 10% at 50% 64%, rgba(255,138,31,0.45), transparent 70%), linear-gradient(180deg, #081833 0%, #142a52 50%, #3a2f5c 64%, #132a52 64.2%, #0a1834 100%)";
  }
  return "radial-gradient(60% 6% at 50% 64%, rgba(255,214,150,0.55), transparent 70%), linear-gradient(180deg, #050f24 0%, #0b1d3d 55%, #1b2f5a 64%, #0c1d3b 64.2%, #071328 100%)";
}

interface Props {
  items: GalleryItem[];
  locale: Locale;
  placeholder: string;
}

export function GalleryStrip({ items, locale, placeholder }: Props) {
  return (
    <ul className="gallery">
      {items.map((item) => (
        <li key={item.id} className="tile">
          {item.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="tile__image"
              src={item.src}
              alt={tr(item.alt, locale) || tr(item.caption, locale)}
              style={item.position ? { objectPosition: item.position } : undefined}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <>
              <div className="tile__sky" style={{ background: skyAt(item.hour) }} aria-hidden="true" />
              <span className="tile__placeholder">{placeholder}</span>
              <span className="tile__hour">{formatTime(item.hour, locale)}</span>
            </>
          )}
          <p className="tile__caption">{tr(item.caption, locale)}</p>
        </li>
      ))}
    </ul>
  );
}
