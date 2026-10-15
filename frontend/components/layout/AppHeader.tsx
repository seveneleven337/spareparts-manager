export default function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold text-text-primary">
          SpareParts Manager
        </p>
        <p className="hidden text-xs text-text-muted sm:block">
          Inventory management workspace
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-success"
        />
        <span className="text-xs font-medium text-text-secondary">
          Local environment
        </span>
      </div>
    </header>
  );
}