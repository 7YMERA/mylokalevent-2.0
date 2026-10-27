// The MyLokalEvent mark: a geometric wau bulan (moon kite), tilted in flight
// with its string trailing down. Colours come from the --logo-* tokens in
// globals.css, so it follows the light and dark themes. Decorative by default;
// the link around it carries the accessible name.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M31.2 46.5C26 53 16.5 50.5 4.5 59.5"
        fill="none"
        stroke="var(--logo-string)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g transform="translate(37 25.5) rotate(16) scale(0.86) translate(-32 -30)">
        <path
          d="M32 4.5c-2.6 2.6-3.4 5.6-1.3 8.6h2.6c2.1-3 1.3-6-1.3-8.6Z"
          fill="var(--logo-head)"
        />
        <path
          d="M32 13C22 13 10.5 17 5 26.5c9.5-.6 19.5 1.8 27 8.5 7.5-6.7 17.5-9.1 27-8.5C53.5 17 42 13 32 13Z"
          fill="var(--logo-wing)"
        />
        <path d="M32 35l-2.2 9.5h4.4Z" fill="var(--logo-body)" />
        <path
          d="M12 43.5c5.5 15 34.5 15 40 0-7 7.2-33 7.2-40 0Z"
          fill="var(--logo-tail)"
        />
        <path
          d="M32 13v31.5"
          stroke="var(--background)"
          strokeWidth="1.6"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
