import React from "react";

interface FgiLogoProps {
  className?: string;
  size?: number; // Height/width in pixels since it is circular (1:1 aspect ratio)
}

// Highly polished, modern vector logo: Navy Blue "FGI" text inside a crisp Navy Blue circle outline
export default function FgiLogo({ className = "", size = 48 }: FgiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      {/* Premium Navy Blue Circle Outline */}
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#1e3a8a"
        strokeWidth="9"
        fill="none"
      />
      {/* Bold Navy Blue Typography */}
      <text
        x="60"
        y="72"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="34"
        fill="#1e3a8a"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        FGI
      </text>
    </svg>
  );
}

// Clean, high-fidelity Base64 SVG Data URL for PDF exports and general HTML images
export const DEFAULT_FGI_LOGO_SVG = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNTAiIHN0cm9rZT0iIzFlM2E4YSIgc3Ryb2tlLXdpZHRoPSI5IiBmaWxsPSJub25lIi8+CiAgPHRleHQgeD0iNjAiIHk9IjcyIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjM0IiBmaWxsPSIjMWUzYThhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMC41Ij5GR0k8L3RleHQ+Cjwvc3ZnPg==`;
