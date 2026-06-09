export function GymSwordLogo({ className = "", showText = true, variant = "dark" }) {
  const color = variant === "dark" ? "#000" : "#fff";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 4 L40 22 L58 24 L44 36 L48 56 L32 46 L16 56 L20 36 L6 24 L24 22 Z"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        <path d="M32 14 L32 50" stroke={color} strokeWidth="2.5" />
        <path d="M22 30 L42 30" stroke={color} strokeWidth="1.5" />
      </svg>
      {showText && (
        <span
          className="font-display text-xl font-bold tracking-luxury"
          style={{ color }}
        >
          GYMSWORD
        </span>
      )}
    </div>
  );
}

export function GymSwordLogoLarge({ className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg width="80" height="80" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 4 L40 22 L58 24 L44 36 L48 56 L32 46 L16 56 L20 36 L6 24 L24 22 Z"
          stroke="#fff"
          strokeWidth="2.5"
          fill="none"
        />
        <path d="M32 14 L32 50" stroke="#fff" strokeWidth="2.5" />
        <path d="M22 30 L42 30" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <span className="font-display text-3xl font-bold tracking-luxury text-white">
        GYMSWORD
      </span>
      <span className="text-overline text-white/70">Forge Your Strength</span>
    </div>
  );
}
