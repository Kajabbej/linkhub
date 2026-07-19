"use client";

import React from "react";
import CountUp from "react-countup";
import { useReducedMotion } from "framer-motion";

interface StatCounterProps {
  value: string | number;
  duration?: number;
}

export function StatCounter({ value, duration = 0.8 }: StatCounterProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span>{value}</span>;
  }

  const stringVal = String(value);
  
  // Extract the numeric portion (including optional decimal)
  // Support both dot and comma, but we clean it up for float parsing
  // Replace thousand-separator dots first to parse properly, e.g. "1.245" -> "1245"
  // Wait, if it has a percentage ratio like "12.5%", it uses a dot.
  // Let's check: if there is a dot followed by 3 digits at the end of the string or before a comma, it's likely a thousand separator.
  // A simple way is to remove all dots that look like thousand separators, or check if it's conversion rate.
  // If it's conversion rate (e.g. "15.4%"), it has one dot. If it's views (e.g. "1.245"), it has one dot as well.
  // Let's write a robust parser:
  let parsedString = stringVal;
  let isPercentage = stringVal.includes("%");

  if (!isPercentage && stringVal.includes(".") && stringVal.split(".").pop()?.length === 3) {
    // Looks like thousand separator "1.245" -> "1245"
    parsedString = stringVal.replace(/\./g, "");
  }

  const numberMatch = parsedString.match(/[\d.]+/);
  if (!numberMatch) {
    return <span>{value}</span>;
  }

  const numericValue = parseFloat(numberMatch[0]);
  const numberIndex = stringVal.indexOf(numberMatch[0]);
  
  // We keep the original prefix and suffix from the original string
  const prefix = stringVal.substring(0, numberIndex);
  const suffix = stringVal.substring(numberIndex + numberMatch[0].length);

  // Decimals check (only if it has a dot and is a percentage / decimal value)
  const hasDecimal = numberMatch[0].includes(".") && (isPercentage || numberMatch[0].split(".")[1].length < 3);
  const decimals = hasDecimal ? numberMatch[0].split(".")[1].length : 0;

  return (
    <span>
      {prefix}
      <CountUp
        end={numericValue}
        duration={duration}
        decimals={decimals}
        separator="."
        decimal=","
      />
      {suffix}
    </span>
  );
}
