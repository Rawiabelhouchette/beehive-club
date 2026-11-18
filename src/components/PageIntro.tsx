import { tr } from "@/content/types";
import type { IntroPhoto } from "@/content/photos";
import type { Locale } from "@/i18n/config";

interface Props {
  title: string;
  lead?: string;
  /** Photo affichée dans une alvéole à droite du titre (masquée sur petit écran). */
  photo?: IntroPhoto;
  locale?: Locale;
}

/** En-tête des pages intérieures : le motif en alvéoles et une photo dans une alvéole. */
export function PageIntro({ title, lead, photo, locale = "fr" }: Props) {
  return (
    <header className={`page-intro wall${photo ? " page-intro--photo" : ""}`}>
      <div className="comb-pattern" aria-hidden="true" />
      <div className="container page-intro__inner">
        <div className="page-intro__text">
          <h1 className="display page-intro__title">{title}</h1>
          {lead ? <p className="page-intro__lead">{lead}</p> : null}
        </div>
        {photo ? (
          <figure className="page-intro__photo hex-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={tr(photo.alt, locale)}
              width={photo.width}
              height={photo.height}
              style={photo.position ? { objectPosition: photo.position } : undefined}
              decoding="async"
            />
          </figure>
        ) : null}
      </div>
    </header>
  );
}
