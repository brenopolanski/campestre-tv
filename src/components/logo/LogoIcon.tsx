const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
}

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const LogoIcon = ({ className, size = 'md', ...props }: LogoIconProps) => {
  const dimension = sizeMap[size]

  return (
    <svg
      className={className}
      fill="currentColor"
      height={dimension}
      viewBox="0 0 110.63 110.63"
      width={dimension}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M33.92,33.03v44.56c0,1.8,1.95,2.92,3.51,2.02l38.59-22.28c1.56-.9,1.56-3.15,0-4.05l-38.59-22.28c-1.56-.9-3.51.22-3.51,2.02h0Z"
        fill="#65be6f"
      />
      <path d="M55.15,3.57l-29.7,17.15c-.82.47-1.32,1.35-1.32,2.29v64.6c0,.95.51,1.82,1.32,2.29l4.24,2.45c.82.47,1.83.47,2.65,0l40.04-23.12,24.13,13.93-46.93,27.1c-.82.47-1.83.47-2.65,0L1.32,83.94c-.81-.47-1.32-1.35-1.32-2.29V28.98c0-.95.51-1.82,1.32-2.29L46.93.36c.82-.47,1.83-.47,2.65,0l5.57,3.22h0Z" />
      <polygon points="37.92 21.48 44.81 25.46 68.94 11.53 62.05 7.55 37.92 21.48" />
      <polygon points="51.7 29.44 58.6 33.42 82.73 19.49 75.83 15.51 51.7 29.44" />
      <polygon points="65.49 37.4 72.39 41.38 96.52 27.45 89.62 23.47 65.49 37.4" />
    </svg>
  )
}
