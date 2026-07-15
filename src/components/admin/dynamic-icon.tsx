"use client";

import * as Lucide from "lucide-react";

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function DynamicIcon({ name, size = 20, className = "" }: DynamicIconProps) {
  // Try to find the icon in the Lucide library
  const IconComponent = (Lucide as any)[name];
  
  if (!IconComponent) {
    // Fallback icon if not found
    return <Lucide.Link size={size} className={className} />;
  }
  
  return <IconComponent size={size} className={className} />;
}
