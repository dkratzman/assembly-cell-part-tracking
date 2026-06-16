"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { improvementAreas } from "@/lib/types";
import type { ImprovementArea, ImprovementRequestInsert } from "@/lib/types";

type FormState = {
  title: string;
  area: ImprovementArea;
  description: string;
  submitted_by: string;
  contact: string;
};

const initialState: FormState = {
  title: "",
  area: "Missing Part Flow",
  description: "",
  submitted_by: "",
  contact: "",
};

export function ImprovementRequestForm() {
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

    const request: ImprovementRequestInsert = {
      title: form.title.trim(),
      area: form.area,
      description: form.description.trim(),
      submitted_by: form.submitted_by.trim() || null,
      contact: form.contact.trim() || null,
    };

    if (!request.title) {
      setError("Give the improvement a short title.");
      return;
    }

    if (request.description.length < 10) {
      setError("Add a little more detail so the idea can be reviewed.");
      return;
    }

    if (!hasSupabaseConfig) {
      setError("Supabase is not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("improvement_requests").insert(request);
      if (insertError) throw insertError;
      setForm(initialState);
      setMessage("Improvement submitted for review.");
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : "";
      setError(
        errorMessage.includes("improvement_requests")
          ? "Improvement review table is not set up in Supabase yet."
          : errorMessage || "Unable to submit improvement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form panel" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Improvement Title</span>
          <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Short summary" required />
        </label>
        <label>
          <span>Area</span>
          <select value={form.area} onChange={(event) => update("area", event.target.value as ImprovementArea)}>
            {improvementAreas.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Your Name</span>
          <input value={form.submitted_by} onChange={(event) => update("submitted_by", event.target.value)} placeholder="Optional" />
        </label>
        <label>
          <span>Contact</span>
          <input value={form.contact} onChange={(event) => update("contact", event.target.value)} placeholder="Optional email, Teams, or extension" />
        </label>
        <label className="form-wide">
          <span>Details</span>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="What should change, and what problem would it solve?"
            required
          />
        </label>
      </div>

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? (
        <p className="form-alert success">
          <CheckCircle2 size={18} />
          {message}
        </p>
      ) : null}

      <button className="button primary submit-button" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Improvement"}
      </button>
    </form>
  );
}
