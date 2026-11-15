import React from "react";

interface PosterArtProps {
  title: string;
  seed: string;
  aspect?: "2/3" | "16/9";
  subtitle?: string;
  hideTitle?: boolean;
  className?: string;
}

interface PaletteStop {
  from: string;
  via: string;
  to: string;
  motif: "rings" | "lines" | "frame" | "horizon" | "diagonal";
}

const PALETTES: Record<string, PaletteStop> = {
  "dune-sand": { from: "#23201C", via: "#171614", to: "#0B0C0E", motif: "horizon" },
  "concrete-grid": { from: "#1D2026", via: "#15181D", to: "#0B0C0F", motif: "frame" },
  "obsidian-arc": { from: "#211E1D", via: "#141416", to: "#090A0C", motif: "rings" },
  "forest-tunnel": { from: "#181E1C", via: "#121615", to: "#090B0B", motif: "lines" },
  "mist-horizon": { from: "#1C2026", via: "#15181E", to: "#0B0C10", motif: "horizon" },
  "amber-haze": { from: "#241F1A", via: "#161515", to: "#0A0B0D", motif: "diagonal" },
  "ash-monolith": { from: "#1F2124", via: "#15171A", to: "#0A0B0D", motif: "frame" },
  "monolith-fog": { from: "#1B1E23", via: "#14161A", to: "#090A0C", motif: "rings" },
  "stairwell-shadow": { from: "#1E1F22", via: "#141518", to: "#0A0B0D", motif: "lines" },
  "twilight-bridge": { from: "#1D1E24", via: "#14151A", to: "#0A0B0D", motif: "diagonal" },
  "winter-stone": { from: "#202226", via: "#16181B", to: "#0B0C0F", motif: "frame" },
  "alpine-glass": { from: "#1C2125", via: "#14171B", to: "#0A0C0E", motif: "horizon" },
  "desert-steel": { from: "#211F1E", via: "#161617", to: "#0A0B0D", motif: "diagonal" },
  "glass-bunker": { from: "#1A1E22", via: "#131619", to: "#090B0D", motif: "rings" },
  "ash-horizon": { from: "#1E2023", via: "#141618", to: "#0A0B0D", motif: "horizon" },
  "ferrix-iron": { from: "#211E1C", via: "#151517", to: "#0A0B0D", motif: "lines" },
  "wall-basalt": { from: "#1E1D20", via: "#141417", to: "#090A0C", motif: "frame" },
  "silver-vellum": { from: "#222428", via: "#17191C", to: "#0B0C0F", motif: "rings" },
};

function getPalette(seed: string): PaletteStop {
  if (PALETTES[seed]) return PALETTES[seed];
  const keys = Object.keys(PALETTES);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % keys.length;
  }
  return PALETTES[keys[Math.abs(hash)]];
}

export const PosterArt: React.FC<PosterArtProps> = ({
  title,
  seed,
  aspect = "2/3",
  subtitle,
  hideTitle = false,
  className = "",
}) => {
  const palette = getPalette(seed);
  const aspectClass = aspect === "16/9" ? "aspect-video" : "aspect-[2/3]";

  return (
    <div
      className={`relative overflow-hidden select-none ${aspectClass} ${className}`}
      style={{
        background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.via} 55%, ${palette.to} 100%)`,
      }}
    >
      {/* Subtle architectural geometric texture */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-25 pointer-events-none"
        viewBox={aspect === "16/9" ? "0 0 320 180" : "0 0 200 300"}
        preserveAspectRatio="xMidYMid slice"
      >
        {palette.motif === "rings" && (
          <g fill="none" stroke="rgba(244,245,247,0.22)" strokeWidth="0.75">
            <circle cx="50%" cy="38%" r="42" />
            <circle cx="50%" cy="38%" r="74" />
            <circle cx="50%" cy="38%" r="108" strokeDasharray="3 5" />
          </g>
        )}
        {palette.motif === "lines" && (
          <g fill="none" stroke="rgba(244,245,247,0.18)" strokeWidth="0.75">
            <line x1="20%" y1="0" x2="20%" y2="100%" />
            <line x1="50%" y1="0" x2="50%" y2="100%" />
            <line x1="80%" y1="0" x2="80%" y2="100%" />
            <line x1="0" y1="34%" x2="100%" y2="34%" />
          </g>
        )}
        {palette.motif === "frame" && (
          <g fill="none" stroke="rgba(244,245,247,0.2)" strokeWidth="0.75">
            <rect x="14%" y="12%" width="72%" height="58%" rx="2" />
            <rect x="24%" y="20%" width="52%" height="42%" rx="2" />
          </g>
        )}
        {palette.motif === "horizon" && (
          <g fill="none" stroke="rgba(244,245,247,0.2)" strokeWidth="0.75">
            <line x1="0" y1="48%" x2="100%" y2="48%" />
            <line x1="0" y1="53%" x2="100%" y2="53%" strokeOpacity="0.45" />
            <circle cx="50%" cy="48%" r="36" />
          </g>
        )}
        {palette.motif === "diagonal" && (
          <g fill="none" stroke="rgba(244,245,247,0.18)" strokeWidth="0.75">
            <line x1="-10%" y1="75%" x2="110%" y2="15%" />
            <line x1="-10%" y1="90%" x2="110%" y2="30%" strokeOpacity="0.5" />
          </g>
        )}
      </svg>

      {/* Vertical black legibility scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(7,8,10,0.92) 0%, rgba(7,8,10,0.42) 45%, rgba(7,8,10,0.08) 100%)",
        }}
      />

      {!hideTitle && (
        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end">
          {subtitle && (
            <span className="text-[10px] font-medium tracking-[0.06em] uppercase text-[var(--text-3)] mb-0.5 truncate">
              {subtitle}
            </span>
          )}
          <span
            className={`font-semibold text-[var(--text)] leading-tight tracking-tight line-clamp-2 ${
              aspect === "16/9" ? "text-[14px]" : "text-[13px]"
            }`}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};
