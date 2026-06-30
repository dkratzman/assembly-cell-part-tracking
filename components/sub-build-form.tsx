"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import type { AssemblySubBuild, AssemblySubBuildInsert } from "@/lib/types";

type FormState = {
  build_date: string;
  eso: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialState: FormState = {
  build_date: today,
  eso: "",
};

export function SubBuildForm({
  existingBuilds,
  onSubmitBuild,
}: {
  existingBuilds: AssemblySubBuild[];
  onSubmitBuild: (build: AssemblySubBuildInsert) => Promise<void>;
}) {
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

    const duplicate = existingBuilds.some((build) => build.build_date === form.build_date && build.eso === eso);
    if (duplicate) {
      setError("That ESO is already listed for this build date.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitBuild({
        build_date: form.build_date,
        eso,
      });
      setForm({ ...initialState, build_date: form.build_date });
      setMessage("ESO added.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to add ESO.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="sub-build-entry" onSubmit={handleSubmit}>
      <label>
        <span>Build Date</span>
        <input type="date" value={form.build_date} onChange={(event) => update("build_date", event.target.value)} required />
      </label>
      <label>
        <span>ESO</span>
        <input value={form.eso} maxLength={5} onChange={(event) => update("eso", event.target.value.toUpperCase())} placeholder="ABCDE" required />
      </label>
      <button className="button primary sub-add-button" disabled={submitting}>
        <Plus size={18} />
        {submitting ? "Adding..." : "Add ESO"}
      </button>

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? <p className="form-alert success">{message}</p> : null}
    </form>
  );
}
