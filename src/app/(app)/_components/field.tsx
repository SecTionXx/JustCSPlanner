import * as React from "react";

import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  /** value column; pass any react node */
  children?: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
}

/**
 * Label / value pair used in the Job Detail field grid and the create form.
 */
export function Field({ label, children, value, className }: FieldProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="text-sm text-foreground">
        {value ?? children ?? <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div>
        <h1 className="text-[22px] font-bold leading-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface PanelProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: PanelProps): React.ReactElement {
  return (
    <section
      className={cn(
        "rounded-[14px] border bg-card text-card-foreground p-4",
        className,
      )}
    >
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? (
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
