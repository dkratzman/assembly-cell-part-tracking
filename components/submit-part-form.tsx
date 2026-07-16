"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { isDuplicateCandidate } from "@/lib/parts";
import { criticalityLevels, kitContexts, stalls } from "@/lib/types";
import type { CriticalityLevel, KitContext, MissingPart, MissingPartInsert, Stall } from "@/lib/types";

type FormState = {
  eso: string;
  stall: Stall;
  kit_context: KitContext;
  kit_no: string;
  part_no: string;
  quantity: string;
  criticality: CriticalityLevel;
  replacement_for_defective_part: boolean;
};

const initialState: FormState = {
  eso: "",
  stall: "Stall 1",
  kit_context: "Kit",
  kit_no: "",
  part_no: "",
  quantity: "1",
  criticality: "Normal",
  replacement_for_defective_part: false,
};

export function SubmitPartForm({
  existingParts,
  onSubmitPart,
}: {
  existingParts: MissingPart[];
  onSubmitPart: (part: MissingPartInsert) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ackDuplicate, setAckDuplicate] = useState(false);

  const duplicate = useMemo(() => {
    const comparable = {
      eso: form.eso,
      stall: form.stall,
      kit_context: form.kit_context,
      kit_no: form.kit_no || null,
      part_no: form.part_no,
    };
    return existingParts.find((part) => isDuplicateCandidate(part, comparable));
  }, [existingParts, form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
    if (["eso", "stall", "kit_context", "kit_no", "part_no"].includes(key)) setAckDuplicate(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const eso = form.eso.trim().toUpperCase();
    const partNo = form.part_no.trim();
    const quantity = Number(form.quantity);

    if (!/^[A-Z0-9]{5}$/.test(eso)) {
      setError("ESO must be exactly 5 uppercase letters or numbers.");
      return;
    }

    if (!partNo) {
      setError("Part No. is required.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }

    if (duplicate && !ackDuplicate) {
      setError("This looks like an active duplicate. Confirm the warning if this is still a separate request.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPart({
        eso,
        stall: form.stall,
        kit_context: form.kit_context,
        kit_no: form.kit_no.trim() || null,
        part_no: partNo,
        quantity,
        criticality: form.criticality,
        replacement_for_defective_part: form.replacement_for_defective_part,
      });
      setForm(initialState);
      setAckDuplicate(false);
      setMessage("Missing part submitted.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit missing part.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form panel" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>ESO</span>
          <input
            value={form.eso}
            maxLength={5}
            onChange={(event) => update("eso", event.target.value.toUpperCase())}
            placeholder="ABCDE"
            required
          />
        </label>
        <label>
          <span>Stall</span>
          <select value={form.stall} onChange={(event) => update("stall", event.target.value as Stall)}>
            {stalls.map((stall) => (
              <option key={stall}>{stall}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Context</span>
          <select value={form.kit_context} onChange={(event) => update("kit_context", event.target.value as KitContext)}>
            {kitContexts.map((context) => (
              <option key={context}>{context}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Kit / Subassembly</span>
          <input value={form.kit_no} onChange={(event) => update("kit_no", event.target.value)} placeholder="SX-9999 or leave blank" />
        </label>
        <label>
          <span>Part No.</span>
          <input value={form.part_no} onChange={(event) => update("part_no", event.target.value)} placeholder="123-4567" required />
        </label>
        <label>
          <span>Quantity</span>
          <input type="number" min={1} step={1} value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
        </label>
        <label>
          <span>Criticality</span>
          <select value={form.criticality} onChange={(event) => update("criticality", event.target.value as CriticalityLevel)}>
            {criticalityLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="quality-request">
        <input
          type="checkbox"
          checked={form.replacement_for_defective_part}
          onChange={(event) => update("replacement_for_defective_part", event.target.checked)}
        />
        <span>Replacement for Defective Part (Quality)</span>
      </label>

      {duplicate ? (
        <label className="duplicate-warning">
          <input type="checkbox" checked={ackDuplicate} onChange={(event) => setAckDuplicate(event.target.checked)} />
          <span>
            <AlertCircle size={18} />
            Active duplicate found for {duplicate.part_no} / {duplicate.eso} / {duplicate.stall}. Submit anyway.
          </span>
        </label>
      ) : null}

      {error ? <p className="form-alert error">{error}</p> : null}
      {message ? (
        <p className="form-alert success">
          <CheckCircle2 size={18} />
          {message}
        </p>
      ) : null}

      <button className="button primary submit-button" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Missing Part"}
      </button>
    </form>
  );
}
