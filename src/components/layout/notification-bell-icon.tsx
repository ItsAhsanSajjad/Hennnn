export function NotificationBellIcon({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="50%" stopColor="#FFE8C8" />
          <stop offset="100%" stopColor="#E59866" />
        </linearGradient>
        <linearGradient id="clapperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC896" />
          <stop offset="100%" stopColor="#C86428" />
        </linearGradient>
        <filter id="bellShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Top hanger ring */}
      <circle
        cx="12"
        cy="3.5"
        r="1.8"
        stroke="url(#bellGrad)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Bell Body */}
      <path
        d="M12 4.5C8.8 4.5 6.5 7 6.5 10.5V14.2C6.5 15.2 5.8 16 5 16.6V17.5H19V16.6C18.2 16 17.5 15.2 17.5 14.2V10.5C17.5 7 15.2 4.5 12 4.5Z"
        fill="url(#bellGrad)"
        filter="url(#bellShadow)"
      />

      {/* Inner subtle specular highlight */}
      <path
        d="M9 7.5C8 9 8 11.5 8 13.5"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Clapper at bottom */}
      <path
        d="M10.2 18.2C10.4 19.5 11.1 20.2 12 20.2C12.9 20.2 13.6 19.5 13.8 18.2H10.2Z"
        fill="url(#clapperGrad)"
      />
    </svg>
  );
}
