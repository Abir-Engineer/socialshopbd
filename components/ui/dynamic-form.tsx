"use client";

import { useId } from "react";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "tel" | "email" | "number" | "textarea";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
};

type DynamicFormProps = {
  fields: FieldConfig[];
  error: string | null;
  disabled: boolean;
  children?: React.ReactNode;
};

export function DynamicForm({ fields, error, disabled, children }: DynamicFormProps) {
  const uid = useId();

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const id = `${uid}-${f.name}`;
        return (
          <label key={f.name} className="block space-y-2" htmlFor={id}>
            <span className="text-sm font-medium text-card-foreground">
              {f.label}
              {f.required && <span className="text-rose-500 ml-0.5">*</span>}
            </span>
            {f.type === "textarea" ? (
              <textarea
                id={id}
                name={f.name}
                rows={f.rows ?? 4}
                defaultValue={f.defaultValue}
                placeholder={f.placeholder}
                disabled={disabled}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            ) : (
              <input
                id={id}
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                defaultValue={f.defaultValue}
                placeholder={f.placeholder}
                min={f.min}
                max={f.max}
                step={f.step}
                disabled={disabled}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            )}
          </label>
        );
      })}
      {error && (
        <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </p>
      )}
      {children}
    </div>
  );
}
