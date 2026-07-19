import React from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoginButton({
  isLoading,
  loadingText = "Signing In...",
  children,
  className = "",
  disabled,
  ...props
}: LoginButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      aria-busy={isLoading ? "true" : "false"}
      aria-disabled={isLoading || disabled ? "true" : "false"}
      className={`flex w-full cursor-pointer items-center justify-center rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-black/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
