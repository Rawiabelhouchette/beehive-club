import { tr, type MenuCategory, type MenuItem, type MenuTag } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

interface Props {
  category: MenuCategory;
  items?: MenuItem[];
  locale: Locale;
  dict: Dictionary["menuPage"];
  headingLevel?: "h2" | "h3";
}

function formatPrice(price: number, currency: string, locale: Locale) {
  const amount = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 1,
    maximumFractionDigits: 3,
  }).format(price);
  return `${amount} ${currency}`;
}

/**
 * Étiquettes inutiles dans cette catégorie : celle qui porte le nom de la catégorie
 * (« À partager » dans « À partager ») et celles que tous ses plats ont en commun.
 */
function impliedTags(category: MenuCategory): Set<MenuTag> {
  const all = category.items;
  const shared = (MENU_TAGS as readonly MenuTag[]).filter(
    (tag) => tag === category.id || (all.length > 0 && all.every((item) => item.tags.includes(tag))),
  );
  return new Set(shared);
}

const MENU_TAGS = ["signature", "sans-alcool", "veggie", "a-partager"] as const satisfies readonly MenuTag[];

export function MenuGroup({ category, items = category.items, locale, dict, headingLevel = "h3" }: Props) {
  const Heading = headingLevel;
  const implied = impliedTags(category);
  return (
    <section className="menu-group" id={category.id} aria-labelledby={`${category.id}-title`}>
      <Heading id={`${category.id}-title`} className="menu-group__title">
        {tr(category.title, locale)}
      </Heading>
      {category.note ? <p className="menu-group__note">{tr(category.note, locale)}</p> : null}
      <ul className="menu-list">
        {items.map((item) => (
          <li key={item.name.fr} className="menu-item">
            <div className="menu-item__head">
              <span className="menu-item__name">{tr(item.name, locale)}</span>
              {item.price !== null ? (
                <>
                  <span className="menu-item__leader" aria-hidden="true" />
                  <span className="menu-item__price">{formatPrice(item.price, dict.currency, locale)}</span>
                </>
              ) : null}
            </div>
            {tr(item.description, locale) ? (
              <p className="menu-item__description">{tr(item.description, locale)}</p>
            ) : null}
            {item.tags.some((tag) => !implied.has(tag)) ? (
              <p className="menu-item__tags">
                {item.tags.filter((tag) => !implied.has(tag)).map((tag) => (
                  <span key={tag} className={`tag${tag === "signature" ? " tag--signature" : ""}`}>
                    {dict.tags[tag]}
                  </span>
                ))}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
