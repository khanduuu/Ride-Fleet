import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function DashboardShell({
  title,
  subtitle,
  workspace,
  items,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  workspace: string;
  items: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-10 lg:py-12">
      <aside className="lg:w-56 lg:shrink-0">
        <p className="label-eyebrow mb-3 hidden lg:block">{workspace}</p>
        <nav aria-label={`${workspace} navigation`}>
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to} className="shrink-0 lg:shrink">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-medium tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>
        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
