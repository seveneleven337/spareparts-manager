
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Warehouse,
  WarehouseCreate,
  WarehouseListResponse,
} from "@/types/warehouse";

const PAGE_SIZE = 10;

interface WarehouseFormValues {
  name: string;
  location: string;
  description: string;
}

const EMPTY_FORM: WarehouseFormValues = {
  name: "",
  location: "",
  description: "",
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

export default function WarehousesPage() {
  const [data, setData] = useState<WarehouseListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<Warehouse | null>(null);
  const [draft, setDraft] =
    useState<WarehouseFormValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWarehouses() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

      const path = searchTerm
        ? `/warehouses/search?${new URLSearchParams({
            name: searchTerm,
            limit: String(PAGE_SIZE),
            offset: String(offset),
          }).toString()}`
        : `/warehouses?${params.toString()}`;

      try {
        const result =
          await apiGet<WarehouseListResponse>(path);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load warehouses.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadWarehouses();

    return () => {
      cancelled = true;
    };
  }, [offset, searchTerm, reloadKey]);

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
    setEditingWarehouse(null);
    setDraft(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setDraft({
      name: warehouse.name,
      location: warehouse.location,
      description: warehouse.description ?? "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingWarehouse(null);
    setFormError(null);
  };

  const updateDraft = (
    field: keyof WarehouseFormValues,
    value: string,
  ) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveWarehouse = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    const name = draft.name.trim();
    const location = draft.location.trim();
    const description = draft.description.trim();

    if (!name) {
      setFormError("Warehouse name is required.");
      return;
    }

    if (name.length > 150) {
      setFormError("Name cannot exceed 150 characters.");
      return;
    }

    if (!location) {
      setFormError("Location is required.");
      return;
    }

    if (location.length > 200) {
      setFormError("Location cannot exceed 200 characters.");
      return;
    }

    if (description.length > 1000) {
      setFormError("Description cannot exceed 1000 characters.");
      return;
    }

    const payload: WarehouseCreate = {
      name,
      location,
      description: description || null,
    };

    setIsSaving(true);

    try {
      if (editingWarehouse) {
        await apiPatch<Warehouse>(
          `/warehouses/${editingWarehouse.id}`,
          payload,
        );
      } else {
        await apiPost<Warehouse>("/warehouses", payload);
        setOffset(0);
        setSearchInput("");
        setSearchTerm("");
      }

      setIsFormOpen(false);
      setEditingWarehouse(null);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save the warehouse.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteWarehouse = useCallback(
    async (warehouse: Warehouse) => {
      const confirmed = window.confirm(
        `Delete "${warehouse.name}" (${warehouse.id})? This action cannot be undone.`,
      );

      if (!confirmed) {
        return;
      }

      setDeletingId(warehouse.id);
      setError(null);

      try {
        await apiDelete<void>(`/warehouses/${warehouse.id}`);

        if (data && data.items.length === 1 && offset > 0) {
          setOffset(Math.max(0, offset - PAGE_SIZE));
        } else {
          setReloadKey((value) => value + 1);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete the warehouse.",
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
        title="Warehouses"
        description="Manage warehouse locations and information."
        action={
          <Button onClick={openCreateForm}>
            <span aria-hidden="true">+</span>
            Add warehouse
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Warehouse directory
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Search and manage your warehouse records.
            </p>
          </div>

          <form
            onSubmit={applySearch}
            className="flex flex-col gap-3 sm:flex-row"
            role="search"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="warehouse-search"
                className="sr-only"
              >
                Search warehouses by name
              </label>
              <input
                id="warehouse-search"
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search warehouses by name..."
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

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-danger-background p-3 text-sm text-danger"
            >
              <p className="font-medium">
                Unable to complete the request
              </p>
              <p className="mt-1">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() =>
                  setReloadKey((value) => value + 1)
                }
              >
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-surface-secondary">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Warehouse
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 font-semibold text-text-secondary"
                  >
                    Location
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
                      Loading warehouses...
                    </td>
                  </tr>
                ) : data && data.items.length > 0 ? (
                  data.items.map((warehouse) => (
                    <tr
                      key={warehouse.id}
                      className="group transition-colors hover:bg-surface-secondary/70 focus-within:bg-surface-secondary/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-text-primary">
                          {warehouse.name}
                        </div>
                        <div className="mt-1 break-all text-xs text-text-muted">
                          ID: {warehouse.id}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-text-secondary">
                        {warehouse.location}
                      </td>

                      <td className="max-w-xs px-4 py-4 text-text-secondary">
                        <span className="line-clamp-2">
                          {warehouse.description ||
                            "No description"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-text-secondary">
                        {formatDate(warehouse.updated_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Edit ${warehouse.name}`}
                            onClick={() =>
                              openEditForm(warehouse)
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            aria-label={`Delete ${warehouse.name}`}
                            disabled={
                              deletingId === warehouse.id
                            }
                            onClick={() =>
                              void deleteWarehouse(warehouse)
                            }
                          >
                            {deletingId === warehouse.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center"
                    >
                      <p className="font-medium text-text-primary">
                        {searchTerm
                          ? "No matching warehouses found"
                          : "No warehouses available"}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {searchTerm
                          ? "Try another name or clear the search."
                          : "Add a warehouse to get started."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-secondary">
              {total === 0
                ? "0 records"
                : `${offset + 1}–${Math.min(
                    offset + PAGE_SIZE,
                    total,
                  )} of ${total} records`}
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
                  setOffset((value) =>
                    Math.max(0, value - PAGE_SIZE),
                  )
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
                onClick={() =>
                  setOffset((value) => value + PAGE_SIZE)
                }
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
            aria-labelledby="warehouse-form-title"
            className="my-auto w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="warehouse-form-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  {editingWarehouse
                    ? "Edit warehouse"
                    : "Add warehouse"}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter the warehouse information below.
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

            <form
              onSubmit={saveWarehouse}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="warehouse-name"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  id="warehouse-name"
                  type="text"
                  required
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
                  htmlFor="warehouse-location"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Location <span className="text-danger">*</span>
                </label>
                <input
                  id="warehouse-location"
                  type="text"
                  required
                  maxLength={200}
                  value={draft.location}
                  onChange={(event) =>
                    updateDraft("location", event.target.value)
                  }
                  placeholder="Warehouse address or location"
                  className="min-h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                />
              </div>

              <div>
                <label
                  htmlFor="warehouse-description"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Description
                </label>
                <textarea
                  id="warehouse-description"
                  rows={3}
                  maxLength={1000}
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Optional description"
                  className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                />
                <p className="mt-1 text-right text-xs text-text-muted">
                  {draft.description.length}/1000
                </p>
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

                <Button
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingWarehouse
                      ? "Save changes"
                      : "Create warehouse"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
