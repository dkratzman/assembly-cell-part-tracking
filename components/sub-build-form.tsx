"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { subBuildColumns, subBuildStatuses } from "@/lib/types";
import type { AssemblySubBuildInsert, SubBuildColumnKey, SubBuildStatus } from "@/lib/types";

type FormState = {
  build_date: string;
  eso: string;
  notes: string;
} & Record<SubBuildColumnKey, SubBuildStatus>;

const today = new Date().toISOString().slice(0, 10);

const initialState: FormState = {
  build_date: today,
  eso: "",
  front_fuel_filters: "Open",
  amots: "Open",
  snake_coffin: "Open",
  water_manifolds: "Open",
  water_regulators: "Open",
  oil_coolers: "Open",
  notes: "",
};

export function SubBuildForm({ onSubmitBuild }: { onSubmitBuild: (build: AssemblySubBuildInsert) => Promise<void> }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const eso = form.eso.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(eso)) {
      setError("ESO must be exactly 5 uppercase letters or numbers.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitBuild({
        build_date: form.build_date,
        eso,
        front_fuel_filters: form.front_fuel_filters,
        amots: form.amots,
        snake_coffin: form.snake_coffin,
        water_manifolds: form.water_manifolds,
        water_regulators: form.water_regulators,
        oil_coolers: form.oil_coolers,
        notes: form.notes.trim() || null,
      });
      setForm({ ...initialState, build_date: form.build_date });
      setMessage("Sub build added.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to add sub build.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form panel sub-build-entry" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Build Date</span>
          <input type="date" value={form.build_date} onChange={(event) => update("build_date", event.target.value)} required />
        </label>
        <label>
          <span>ESO</span>
          <input value={form.eso} maxLength={5} onChange={(event) => update("eso", event.target.value.toUpperCase())} placeholder="ABCDE" required />
        </label>
      </div>

      <div className="sub-build-status-grid">
        {subBuildColumns.map((column) => (
          <label key={column.key}>
            <span>{column.label}</span>
            <select value={form[column.key]} onChange={(event) => update(column.key, event.target.value as SubBuildStatus)}>
              {subBuildStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label>
        <span>Notes</span>
        <input value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Optional" />
      </label>

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? (
        <p className="form-alert success">
          <CheckCircle2 size={18} />
          {message}
        </p>
      ) : null}

      <button className="button primary submit-button" disabled={submitting}>
        {submitting ? "Adding..." : "Add Sub Build"}
      </button>
    </form>
  );
}
