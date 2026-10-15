import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export default function PartsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Parts"
        description="Manage spare parts and their inventory information."
      />

      <Card>
        <h2 className="text-base font-semibold text-text-primary">
          Parts inventory
        </h2>

        <p className="mt-2 text-sm leading-6 text-text-secondary">
          This section will display spare parts retrieved from the Parts
          Service. You will be able to review, create, edit, search, and
          delete records.
        </p>

        <p className="mt-4 text-xs text-text-muted">
          Database: PostgreSQL
        </p>
      </Card>
    </AppShell>
  );
}