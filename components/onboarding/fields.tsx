"use client";

import { cn } from "@/lib/utils";

export function MoneyInput({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      <span className="mt-2 flex h-12 items-center rounded-lg border bg-card px-3 focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20">
        <span className="text-muted-foreground" aria-hidden>$</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? value.toLocaleString("en-US") : ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
          className="tabular h-full w-full bg-transparent pl-1 text-base outline-none"
        />
      </span>
    </label>
  );
}

export function NumberInput({ id, label, value, min, max, onChange }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className="tabular mt-2 h-12 w-full rounded-lg border bg-card px-3 text-base outline-none focus:border-pine focus:ring-2 focus:ring-pine/20"
      />
    </label>
  );
}

export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: { value: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div role="radiogroup" className="mt-2 grid gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn("tap rounded-lg border bg-card px-4 py-3 text-left transition-colors", on ? "border-pine bg-pine/5 ring-2 ring-pine/25" : "hover:border-pine/40")}
            >
              <span className="block font-semibold">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-sm text-muted-foreground">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <fieldset className="flex items-center justify-between gap-4">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm font-semibold" aria-hidden>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-lg border bg-card p-0.5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn("tap rounded-md px-4 text-sm font-semibold", value === v ? "bg-pine text-white" : "text-muted-foreground")}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
