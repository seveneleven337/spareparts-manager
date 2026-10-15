import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

export default function WarehousesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Warehouses"
        description="View and manage warehouse records."
      />

      <Card>
        <h2 className="text-base font-semibold text-text-primary">
          Warehouse directory
        </h2>

        <p className="mt-2 text-sm leading-6 text-text-secondary">
          This section will display warehouse records retrieved from the
          Warehouse Service. You will be able to review, create, edit,
          search, and delete warehouse information.
        </p>

        <p className="mt-4 text-xs text-text-muted">
          Database: MongoDB
        </p>
      </Card>
    </AppShell>
  );
}