import React from "react";
import { DEFAULT_LOGO_BASE64 } from "../assets/logoBase64";

interface FgiLogoProps {
  className?: string;
  size?: number; // Height in pixels
}

// Crisp corporate FGI logo component
export default function FgiLogo({ className = "", size = 48 }: FgiLogoProps) {
  return (
    <img
      src={DEFAULT_LOGO_BASE64}
      alt="FGI Corporate Logo"
      style={{ height: `${size}px`, width: "auto" }}
      className={`inline-block object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}

export const DEFAULT_FGI_LOGO_SVG = DEFAULT_LOGO_BASE64;

