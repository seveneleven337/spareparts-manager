"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Employee,
  EmployeeCreate,
  EmployeeListResponse,
  EmployeeUpdate,
} from "@/types/employee";

const PAGE_SIZE = 9;

interface EmployeeForm {
  name: string;
  email: string;
  position: string;
}

const EMPTY_FORM: EmployeeForm = {
  name: "",
  email: "",
  position: "",
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });

      const path = search.trim()
        ? `/employees/search?${new URLSearchParams({
            name: search.trim(),
            limit: String(PAGE_SIZE),
            offset: String(page * PAGE_SIZE),
          }).toString()}`
        : `/employees?${query.toString()}`;

      const response = await apiGet<EmployeeListResponse>(path);

      setEmployees(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load employees.",
      );
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  function openCreateModal() {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      position: employee.position,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function updateForm(field: keyof EmployeeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload: EmployeeCreate = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      position: form.position.trim(),
    };

    if (!payload.name || !payload.email || !payload.position) {
      setFormError("Name, email, and position are required.");
      return;
    }

    if (payload.name.length > 150) {
      setFormError("Name must not exceed 150 characters.");
      return;
    }

    if (payload.position.length > 100) {
      setFormError("Position must not exceed 100 characters.");
      return;
    }

    if (
      payload.email.length > 254 ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)
    ) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);

    try {
      if (editingEmployee) {
        const updatePayload: EmployeeUpdate = payload;

        await apiPatch<Employee>(
          `/employees/${editingEmployee.id}`,
          updatePayload,
        );
      } else {
        await apiPost<Employee>("/employees", payload);
      }

      setModalOpen(false);
      setEditingEmployee(null);
      setForm(EMPTY_FORM);

      if (!editingEmployee && page !== 0) {
        setPage(0);
      } else {
        await loadEmployees();
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to save employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(
      `Delete ${employee.name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");

    try {
      await apiDelete<void>(`/employees/${employee.id}`);

      if (employees.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadEmployees();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete employee.",
      );
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell>
      <PageHeader
        title="Employees"
        description="View and manage employee records."
        action={
          <Button onClick={openCreateModal}>
            Add employee
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Employee directory
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {total} {total === 1 ? "employee" : "employees"} registered
              </p>
            </div>

            <div className="w-full sm:max-w-sm">
              <label
                htmlFor="employee-search"
                className="sr-only"
              >
                Search employees by name
              </label>
              <input
                id="employee-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search by employee name..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </Card>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => void loadEmployees()}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div
            className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-text-secondary"
            role="status"
          >
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-background text-text-secondary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="size-7"
                  aria-hidden="true"
                >
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="7" r="4" />
                  <path
                    d="M20 8v6m3-3h-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {search.trim()
                  ? "No employees found"
                  : "No employees yet"}
              </h3>

              <p className="mt-2 text-sm text-text-secondary">
                {search.trim()
                  ? "Try another name or clear your search."
                  : "Add your first employee to get started."}
              </p>

              {!search.trim() && (
                <div className="mt-5">
                  <Button onClick={openCreateModal}>
                    Add employee
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee) => (
              <Card key={employee.id}>
                <div className="flex h-full flex-col">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
                      aria-hidden="true"
                    >
                      {getInitials(employee.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold text-text-primary">
                        {employee.name}
                      </h3>
                      <p className="mt-1 break-words text-sm text-text-secondary">
                        {employee.position}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md bg-background px-2 py-1 text-xs text-text-secondary">
                      #{employee.id}
                    </span>
                  </div>

                  <div className="mt-5 flex-1 space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="mt-0.5 size-4 shrink-0 text-text-secondary"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                      <a
                        href={`mailto:${employee.email}`}
                        className="break-all text-text-secondary transition hover:text-blue-600"
                      >
                        {employee.email}
                      </a>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path
                          d="M12 7v5l3 2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        Updated {formatDate(employee.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-text-muted">
                      Employee #{employee.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => openEditModal(employee)}
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => void handleDelete(employee)}
                        variant="secondary"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Showing {page * PAGE_SIZE + (total > 0 ? 1 : 0)}–
              {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-text-secondary">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
            className="my-auto w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <div className="mb-6">
              <h2
                id="employee-modal-title"
                className="text-lg font-semibold text-text-primary"
              >
                {editingEmployee ? "Edit employee" : "Add employee"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Enter the employee&apos;s details below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="employee-name"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Full name
                </label>
                <input
                  id="employee-name"
                  required
                  maxLength={150}
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Alex Johnson"
                />
              </div>

              <div>
                <label
                  htmlFor="employee-email"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Email address
                </label>
                <input
                  id="employee-email"
                  type="email"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    updateForm("email", event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="alex@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="employee-position"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Position
                </label>
                <input
                  id="employee-position"
                  required
                  maxLength={100}
                  value={form.position}
                  onChange={(event) =>
                    updateForm("position", event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Warehouse Manager"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingEmployee
                      ? "Save changes"
                      : "Create employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}