"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { useLiveNow } from "@/hooks/use-live-now";
import { isUrgent, minutesWaiting, waitingTimerLabel } from "@/lib/parts";
import { partStatuses } from "@/lib/types";
import type { MissingPart, PartStatus } from "@/lib/types";

type DashboardTableProps = {
  parts: MissingPart[];
  loading: boolean;
  error: string | null;
  editable: boolean;
  onUpdatePart?: (id: string, patch: Partial<Pick<MissingPart, "status" | "eta">>) => Promise<void>;
};

export function DashboardTable({ parts, loading, error, editable, onUpdatePart }: DashboardTableProps) {
  const now = useLiveNow();

  if (loading) {
    return <div className="panel muted">Loading missing parts...</div>;
  }

  if (error) {
    return <div className="panel error">Unable to load missing parts: {error}</div>;
  }

  if (parts.length === 0) {
    return <div className="panel muted">No active missing parts match this view.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Part</th>
            <th>Kit / Context</th>
            <th>ESO</th>
            <th>Stall</th>
            <th>Qty</th>
            <th>Status</th>
            <th>ETA</th>
            <th>Waiting</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <DashboardRow key={part.id} part={part} editable={editable} now={now} onUpdatePart={onUpdatePart} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardRow({
  part,
  editable,
  now,
  onUpdatePart,
}: {
  part: MissingPart;
  editable: boolean;
  now: Date;
  onUpdatePart?: DashboardTableProps["onUpdatePart"];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<Pick<MissingPart, "status" | "eta">>) {
    if (!onUpdatePart) return;
    setPending(true);
    setError(null);
    try {
      await onUpdatePart(part.id, patch);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update part.");
    } finally {
      setPending(false);
    }
  }

  const urgent = isUrgent(part, now);
  const overOneHour = minutesWaiting(part, now) >= 60;

  return (
    <tr className={urgent ? "row-urgent" : undefined}>
      <td>
        <div className="priority-cell">
          {part.criticality === "Critical" ? <Clock size={18} /> : null}
          {part.status === "Delivered to Stall" ? <CheckCircle2 size={18} /> : null}
          <span>{part.criticality}</span>
        </div>
      </td>
      <td>
        <strong>{part.part_no}</strong>
      </td>
      <td>
        <span>{part.kit_no || part.kit_context}</span>
        {part.kit_no ? <small>{part.kit_context}</small> : null}
      </td>
      <td>{part.eso}</td>
      <td>{part.stall}</td>
      <td>{part.quantity}</td>
      <td>
        {editable ? (
          <select
            className="inline-select"
            value={part.status}
            disabled={pending}
            onChange={(event) => update({ status: event.target.value as PartStatus })}
          >
            {partStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        ) : (
          <StatusPill part={part} />
        )}
      </td>
      <td>
        {editable ? (
          <input
            className="inline-input"
            defaultValue={part.eta ?? ""}
            disabled={pending}
            placeholder="ETA"
            onBlur={(event) => {
              const nextEta = event.target.value.trim() || null;
              if (nextEta !== part.eta) update({ eta: nextEta, status: nextEta && part.status === "Ordered" ? "ETA Set" : part.status });
            }}
          />
        ) : (
          part.eta || <span className="muted">None</span>
        )}
        {error ? <small className="error">{error}</small> : null}
      </td>
      <td>
        <span className={overOneHour ? "waiting-timer overdue" : "waiting-timer"}>{waitingTimerLabel(part, now)}</span>
      </td>
    </tr>
  );
}
