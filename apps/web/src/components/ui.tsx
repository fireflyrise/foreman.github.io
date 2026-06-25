import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    ghost: "bg-transparent hover:bg-edge text-gray-200 border border-edge",
    subtle: "bg-edge hover:bg-edge/70 text-gray-200",
    danger: "bg-red-600/90 hover:bg-red-500 text-white",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-edge bg-ink px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-blue-500 ${className}`}
      {...props}
    />
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-edge bg-ink px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500 ${className}`}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</label>;
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-edge bg-panel p-4 ${className}`}>{children}</div>;
}
