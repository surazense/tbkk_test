"use client";

import { useState, type ReactNode } from "react";

/**
 * A section of a machine page box. Every one says where its numbers come from: the (i) opens a
 * short note with the data used, how it is worked out and the limits applied, so no figure is a
 * black box.
 */
export default function WidgetCard({
  title,
  how,
  children,
}: {
  title: string;
  /** what the (i) opens: data, calculation, limits */
  how: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-100">{title}</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`How "${title}" is measured`}
          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] leading-none ${
            open ? "border-blue-400 bg-blue-500/20 text-blue-200" : "border-gray-600 text-gray-400 hover:text-gray-200"
          }`}
        >
          i
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-1 rounded-lg bg-[#111c30] p-2 text-[11px] leading-relaxed text-gray-300">{how}</div>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** One labelled line inside a `how` note. */
export function How({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="font-medium text-gray-100">{label}: </span>
      {children}
    </div>
  );
}

/** A titled box of the machine page. */
export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl border border-[#1e293b] bg-[#0b1220] p-3 ${className}`}>
      {title && <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{title}</div>}
      {children}
    </div>
  );
}
