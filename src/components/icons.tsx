import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Pastille de la marque : une alvéole couleur miel. */
export function BrandMark(props: IconProps) {
  return (
    <svg viewBox="0 0 40 46.19" aria-hidden="true" {...props}>
      <polygon points="20,2 38,12.4 38,33.8 20,44.2 2,33.8 2,12.4" fill="none" stroke="#f28c0f" strokeWidth="3.4" strokeLinejoin="round" />
      <polygon points="20,13 28.5,17.9 28.5,28.3 20,33.2 11.5,28.3 11.5,17.9" fill="#f28c0f" />
    </svg>
  );
}

/* --- Autocollants des affiches : contour noir, aplats de couleur ---------------------------------- */

/** Marguerite : pétales blancs, cœur jaune. */
export function DaisySticker(props: IconProps) {
  const petals = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" {...props}>
      <g stroke="#000" strokeWidth="3" strokeLinejoin="round">
        {petals.map((angle) => (
          <ellipse key={angle} cx="60" cy="27" rx="12" ry="24" fill="#FFFDF8" transform={`rotate(${angle} 60 60)`} />
        ))}
        <circle cx="60" cy="60" r="17" fill="#FFE60A" />
      </g>
    </svg>
  );
}

/** Étoile éclatée rouge-orange. */
export function BurstSticker(props: IconProps) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 === 0 ? 56 : 38;
    const a = (Math.PI * 2 * i) / 24 - Math.PI / 2;
    return `${(60 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" {...props}>
      <polygon points={points} fill="#FF3300" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** Éclair rose. */
export function BoltSticker(props: IconProps) {
  return (
    <svg viewBox="0 0 80 120" aria-hidden="true" {...props}>
      <path d="M48 4 10 66h24L24 116 70 46H44L58 4z" fill="#F58CB9" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z" />
    </svg>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.4A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 8.5h2.5V5H14a4 4 0 0 0-4 4v2.5H8V15h2v6h3.5v-6h2.5l.5-3.5h-3V9.25c0-.41.34-.75.75-.75Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function SunsetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.5} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
