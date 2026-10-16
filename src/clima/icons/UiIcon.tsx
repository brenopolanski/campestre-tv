/** Interface glyphs: single 1.8 stroke, rounded corners, same 24 grid. */

const PATHS = {
  location: (
    <path d="M20.2 3.8 3.9 10.6c-.7.3-.6 1.3.1 1.5l6.6 1.4 1.5 6.6c.2.8 1.2.8 1.5.1l6.6-16.4Z" />
  ),
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.6" cy="6.5" fill="currentColor" r="1.1" stroke="none" />
      <circle cx="4.6" cy="12" fill="currentColor" r="1.1" stroke="none" />
      <circle cx="4.6" cy="17.5" fill="currentColor" r="1.1" stroke="none" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" fill="currentColor" r="1.7" stroke="none" />
      <circle cx="12" cy="12" fill="currentColor" r="1.7" stroke="none" />
      <circle cx="18.5" cy="12" fill="currentColor" r="1.7" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="m15.4 15.4 4.8 4.8" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M6 12h12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3 1.8" />
    </>
  ),
  calendar: (
    <>
      <rect height="14.5" rx="3" width="16" x="4" y="5.5" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
    </>
  ),
  thermometer: (
    <>
      <path d="M14 14.2V5a2 2 0 1 0-4 0v9.2a4 4 0 1 0 4 0Z" />
      <path d="M12 16.5V9" />
    </>
  ),
  drop: <path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0c0-4.2 6-10.6 6-10.6Z" />,
  wind: (
    <path d="M3.5 9h10.8a2.7 2.7 0 1 0-2.7-2.7M3.5 13.2h14.8a2.8 2.8 0 1 1-2.8 2.8M3.5 17.2h7" />
  ),
  sunrise: (
    <>
      <path d="M7.5 16a4.5 4.5 0 0 1 9 0M3 19.5h18M12 3.5v4.5m-2.2-2.3L12 3.5l2.2 2.2M4.6 11.6l1.3 1M19.4 11.6l-1.3 1" />
    </>
  ),
  umbrella: (
    <>
      <path d="M3.5 12a8.5 8.5 0 0 1 17 0Z" />
      <path d="M12 12v6.3a2.2 2.2 0 0 1-4.4 0" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.8 4.5v4h-4" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
} as const

export type UiIconName = keyof typeof PATHS

interface UiIconProps {
  name: UiIconName
  size?: number
  className?: string
}

export const UiIcon = ({ name, size = 22, className }: UiIconProps) => {
  return (
    <svg
      className={['ui-icon', className].filter(Boolean).join(' ')}
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  )
}
