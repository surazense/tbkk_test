"use client";

import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  /** Skip the divider above the first section. */
  first?: boolean;
  children: React.ReactNode;
}

/**
 * One group of related fields. On wide screens the title and a short
 * description sit in a left column and the fields use the full width on the
 * right; on narrow screens the title stacks above the fields.
 */
export function FormSection({
  title,
  description,
  first,
  children,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-3 py-6 lg:grid-cols-[180px_minmax(0,1fr)]",
        !first && "border-t border-[#1f2937]"
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-white sm:text-lg">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

/** Field label. Must be rendered inside a FormItem. */
export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <FormLabel className="text-xs font-medium text-gray-200 sm:text-sm">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </FormLabel>
  );
}

/** Responsive field grid: 1 column on phones, 2 on tablets, 3 on wide screens. */
export const FIELD_GRID =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

/**
 * Shared look of text inputs and select triggers in the form. The inputs of
 * this project are content-box, so `w-full` plus padding overflowed the grid
 * column: box-border keeps them inside it.
 */
export const INPUT_CLASS =
  "box-border bg-[#080808] border-[1px] border-[#4B5563] text-white h-9 text-sm";
