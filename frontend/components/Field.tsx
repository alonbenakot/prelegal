"use client";

import { useId } from "react";

const controlClasses = (invalid: boolean) =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
    "placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
      : "border-slate-300 focus:border-slate-500 focus:ring-slate-200",
  ].join(" ");

type BaseProps = {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
};

/** Label, optional hint, control, and error message, wired up for a11y. */
function Wrapper({
  id,
  label,
  hint,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
}: BaseProps & {
  type?: "text" | "date" | "number";
  placeholder?: string;
  min?: number;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} errorId={errorId}>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={controlClasses(Boolean(error))}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  value,
  onChange,
  rows = 3,
  placeholder,
}: BaseProps & { rows?: number; placeholder?: string }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} errorId={errorId}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={controlClasses(Boolean(error))}
      />
    </Wrapper>
  );
}

/** Groups related inputs under a heading, matching a Cover Page section. */
export function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-slate-200 pt-5">
      <legend className="-mt-8 bg-slate-50 pr-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {legend}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}
