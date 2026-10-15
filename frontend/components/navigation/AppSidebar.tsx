"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Overview",
    href: "/",
    symbol: "⌂",
  },
  {
    label: "Parts",
    href: "/parts",
    symbol: "▦",
  },
  {
    label: "Employees",
    href: "/employees",
    symbol: "♙",
  },
  {
    label: "Warehouses",
    href: "/warehouses",
    symbol: "▤",
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-16 shrink-0 flex-col border-r border-border bg-surface sm:w-56 lg:w-64">
      <div className="flex h-16 items-center justify-center border-b border-border px-3 sm:justify-start sm:px-5">
        <Link
          href="/"
          aria-label="SpareParts Manager home"
          className="flex items-center gap-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            SP
          </span>

          <span className="hidden text-sm font-semibold tracking-tight text-text-primary sm:block">
            SpareParts
            <span className="block text-xs font-normal text-text-muted">
              Manager
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 px-2 py-5 sm:px-3"
      >
        <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-text-muted sm:block">
          Workspace
        </p>

        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={[
                "flex min-h-10 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors sm:justify-start",
                isActive
                  ? "bg-indigo-50 text-primary"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="flex w-5 shrink-0 items-center justify-center text-lg"
              >
                {item.symbol}
              </span>

              <span className="hidden sm:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="hidden text-xs leading-5 text-text-muted sm:block">
          SpareParts Manager
          <br />
          Development environment
        </p>
        <p className="text-center text-xs text-text-muted sm:hidden">Dev</p>
      </div>
    </aside>
  );
}