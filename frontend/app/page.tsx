import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const sections = [
  {
    title: "Parts",
    description:
      "Manage spare parts, review inventory records, and update part information.",
    href: "/parts",
    symbol: "▦",
    label: "Parts inventory",
  },
  {
    title: "Employees",
    description:
      "View employee records and manage employee information.",
    href: "/employees",
    symbol: "♙",
    label: "Employee directory",
  },
  {
    title: "Warehouses",
    description:
      "Manage warehouse records and review warehouse information.",
    href: "/warehouses",
    symbol: "▤",
    label: "Warehouse directory",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <PageHeader
        title="Overview"
        description="Welcome to SpareParts Manager. Select a section to manage your data."
      />

      <section aria-labelledby="sections-heading">
        <div className="mb-4">
          <h2
            id="sections-heading"
            className="text-base font-semibold text-text-primary"
          >
            Management sections
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Choose where you want to work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Card
              key={section.href}
              className="transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <Link
                href={section.href}
                className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
                aria-label={`Open ${section.title}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-indigo-50 text-xl text-primary">
                    <span aria-hidden="true">{section.symbol}</span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-lg text-text-muted transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-text-primary">
                  {section.title}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-text-secondary">
                  {section.description}
                </p>

                <div className="mt-5 border-t border-border pt-4">
                  <span className="text-xs font-medium text-text-muted">
                    {section.label}
                  </span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="system-heading">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary">
              <span aria-hidden="true">i</span>
            </div>

            <div>
              <h2
                id="system-heading"
                className="text-sm font-semibold text-text-primary"
              >
                About this workspace
              </h2>

              <p className="mt-1 text-sm leading-6 text-text-secondary">
                This application provides a central interface for managing
                spare parts, employees, and warehouses. Database operations
                will be connected through the API Gateway.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}