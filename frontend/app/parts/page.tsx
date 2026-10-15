"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Part,
  PartCreate,
  PartListResponse,
} from "@/types/part";

const PAGE_SIZE = 10;

type StockFilter = "all" | "in-stock" | "out-of-stock";
type SortOption = "id" | "name" | "stock_quantity";

interface PartFormValues {
  name: string;
  description: string;
  stock_quantity: string;
}

const EMPTY_FORM: PartFormValues = {
  name: "",
  description: "",
  stock_quantity: "0",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-FI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function PartsPage() {
  const [data, setData] = useState<PartListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("id");
  const [offset, setOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [draft, setDraft] = useState<PartFormValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadParts() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      const path = searchTerm
        ? `/parts/search?${new URLSearchParams({
            name: searchTerm,
            limit: String(PAGE_SIZE),
            offset: String(offset),
          }).toString()}`
        : `/parts?${params.toString()}`;

      try {
        const result = await apiGet<PartListResponse>(path);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load parts.",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadParts();

    return () => {
      cancelled = true;
    };
  }, [offset, searchTerm, reloadKey]);

  const visibleParts = useMemo(() => {
    const parts = [...(data?.items ?? [])];

    const filtered = parts.filter((part) => {
      if (stockFilter === "in-stock") {
        return part.stock_quantity > 0;
      }

      if (stockFilter === "out-of-stock") {
        return part.stock_quantity === 0;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "stock_quantity") {
        return a.stock_quantity - b.stock_quantity;
      }

      return a.id - b.id;
    });

    return filtered;
  }, [data, stockFilter, sortBy]);

  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearchTerm(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setOffset(0);
  };

  const openCreateForm = () => {
    setEditingPart(null);
    setDraft(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (part: Part) => {
    setEditingPart(part);
    setDraft({
      name: part.name,
      description: part.description ?? "",
      stock_quantity: String(part.stock_quantity),
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingPart(null);
    setFormError(null);
  };

  const updateDraft = (
    field: keyof PartFormValues,
    value: string,
  ) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const savePart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = draft.name.trim();
    const quantity = Number(draft.stock_quantity);

    if (!name) {
      setFormError("Part name is required.");
      return;
    }

    if (name.length > 150) {
      setFormError("Part name cannot exceed 150 characters.");
      return;
    }

    if (
      draft.stock_quantity.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setFormError("Stock quantity must be a non-negative integer.");
      return;
    }

    const payload: PartCreate = {
      name,
      description: draft.description.trim() || null,
      stock_quantity: quantity,
    };

    setIsSaving(true);

    try {
      if (editingPart) {
        await apiPatch<Part>(
          `/parts/${editingPart.id}`,
          payload,
        );
      } else {
        await apiPost<Part>("/parts", payload);
        setOffset(0);
        setSearchInput("");
        setSearchTerm("");
      }

      setIsFormOpen(false);
      setEditingPart(null);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save the part.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deletePart = useCallback(
    async (part: Part) => {
      const confirmed = window.confirm(
        `Delete "${part.name}" (ID ${part.id})? This action cannot be undone.`,
      );

      if (!confirmed) {
        return;
      }

      setDeletingId(part.id);
      setError(null);

      try {
        await apiDelete<void>(`/parts/${part.id}`);

        if (data && data.items.length === 1 && offset > 0) {
          setOffset(Math.max(0, offset - PAGE_SIZE));
        } else {
          setReloadKey((value) => value + 1);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete the part.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [data, offset],
  );

  return (
    <AppShell>
      <PageHeader
        title="Parts"
        description="Manage spare parts, stock quantities, and inventory records."
        action={
          <Button onClick={openCreateForm}>
            <span aria-hidden="true">+</span>
            Add part
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-text-primary">
              Parts inventory
            </h2>
            <p className="text-sm text-text-secondary">
              Search, filter, and manage your spare parts.
            </p>
          </div>

          <form
            onSubmit={applySearch}
            className="flex flex-col gap-3 sm:flex-row"
            role="search"
          >
            <div className="relative min-w-0 flex-1">
              <label
                htmlFor="parts-search"
                className="sr-only"
              >
                Search parts by name
              </label>

              <input
                id="parts-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search parts by name..."
                maxLength={150}
                className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
              />
            </div>

            <Button type="submit">Search</Button>

            {searchTerm && (
              <Button
                type="button"
                variant="secondary"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="stock-filter"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Stock status
              </label>

              <select
                id="stock-filter"
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(event.target.value as StockFilter)
                }
                className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
              >
                <option value="all">All stock levels</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="parts-sort"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Sort by
              </label>

              <select
                id="parts-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
              >
                <option value="id">ID</option>
                <option value="name">Name</option>
                <option value="stock_quantity">Stock quantity</option>
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-danger-background p-3 text-sm text-danger"
            >
              <p className="font-medium">Unable to complete the request</p>
              <p className="mt-1">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Part
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Stock
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Last updated
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold text-text-secondary"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-text-secondary"
                    >
                      Loading parts...
                    </td>
                  </tr>
                ) : visibleParts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center"
                    >
                      <p className="font-medium text-text-primary">
                        {searchTerm || stockFilter !== "all"
                          ? "No matching parts found"
                          : "No parts available"}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {searchTerm || stockFilter !== "all"
                          ? "Try changing your search or filters."
                          : "Add a part to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibleParts.map((part) => (
                    <tr
                      key={part.id}
                      className="group transition-colors hover:bg-surface-secondary/70 focus-within:bg-surface-secondary/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">
                          {part.name}
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          ID: {part.id}
                        </div>
                      </td>

                      <td className="max-w-xs px-4 py-4 text-text-secondary">
                        <span className="line-clamp-2">
                          {part.description || "No description"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            part.stock_quantity > 0
                              ? "bg-success-background text-success"
                              : "bg-danger-background text-danger",
                          ].join(" ")}
                        >
                          {part.stock_quantity > 0
                            ? `${part.stock_quantity} available`
                            : "Out of stock"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-text-secondary">
                        {formatDate(part.updated_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Edit ${part.name}`}
                            onClick={() => openEditForm(part)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            aria-label={`Delete ${part.name}`}
                            disabled={deletingId === part.id}
                            onClick={() => void deletePart(part)}
                          >
                            {deletingId === part.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-secondary">
              {total === 0
                ? "0 records"
                : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total} records`}
              {stockFilter !== "all" &&
                ` · ${visibleParts.length} match the stock filter on this page`}
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs text-text-secondary">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={isLoading || offset === 0}
                onClick={() =>
                  setOffset((value) => Math.max(0, value - PAGE_SIZE))
                }
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={
                  isLoading ||
                  offset + PAGE_SIZE >= total ||
                  total === 0
                }
                onClick={() => setOffset((value) => value + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="part-form-title"
            className="my-auto w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="part-form-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  {editingPart ? "Edit part" : "Add part"}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter the part information below.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                aria-label="Close form"
                onClick={closeForm}
              >
                ✕
              </Button>
            </div>

            <form onSubmit={savePart} className="space-y-4">
              <div>
                <label
                  htmlFor="part-name"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  id="part-name"
                  type="text"
                  required
                  minLength={1}
                  maxLength={150}
                  autoFocus
                  value={draft.name}
                  onChange={(event) =>
                    updateDraft("name", event.target.value)
                  }
                  className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                />
              </div>

              <div>
                <label
                  htmlFor="part-description"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Description
                </label>
                <textarea
                  id="part-description"
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  placeholder="Optional description"
                  className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                />
              </div>

              <div>
                <label
                  htmlFor="part-stock"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Stock quantity <span className="text-danger">*</span>
                </label>
                <input
                  id="part-stock"
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={draft.stock_quantity}
                  onChange={(event) =>
                    updateDraft("stock_quantity", event.target.value)
                  }
                  className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-danger-background p-3 text-sm text-danger"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={closeForm}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editingPart
                      ? "Save changes"
                      : "Create part"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}