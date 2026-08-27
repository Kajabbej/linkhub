"use client";

import * as Lucide from "lucide-react";

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function DynamicIcon({ name, size = 20, className = "" }: DynamicIconProps) {
  if (!name) {
    return <Lucide.Link size={size} className={className} />;
  }

  // Check if name is an image URL or base64 data string
  const isImageUrl = 
    name.startsWith("http://") || 
    name.startsWith("https://") || 
    name.startsWith("data:") || 
    name.startsWith("/") ||
    name.includes("/");

  if (isImageUrl) {
    return (
      <img
        src={name}
        alt="Icon"
        className={`w-full h-full aspect-square object-cover shrink-0 ${className}`}
      />
    );
  }

  // Try to find the icon in the Lucide library
  const IconComponent = (Lucide as any)[name];

  if (!IconComponent) {
    // Fallback icon if not found
    return <Lucide.Link size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
}

