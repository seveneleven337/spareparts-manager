import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export default function EmployeesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Employees"
        description="View and manage employee records."
      />

      <Card>
        <h2 className="text-base font-semibold text-text-primary">
          Employee directory
        </h2>

        <p className="mt-2 text-sm leading-6 text-text-secondary">
          This section will display employee records retrieved from the
          Employee Service. You will be able to review, create, edit, search,
          and delete employee information.
        </p>

        <p className="mt-4 text-xs text-text-muted">
          Database: MariaDB
        </p>
      </Card>
    </AppShell>
  );
}