"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";
import { subBuildColumns, subBuildStatuses } from "@/lib/types";
import type { AssemblySubBuild, SubBuildColumnKey, SubBuildStatus } from "@/lib/types";

type SubBuildTableProps = {
  builds: AssemblySubBuild[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (id: string, column: SubBuildColumnKey, status: SubBuildStatus) => Promise<void>;
  onUpdateNotes: (id: string, notes: string | null) => Promise<void>;
};

export function SubBuildTable({ builds, loading, error, onUpdateStatus, onUpdateNotes }: SubBuildTableProps) {
  if (loading) return <div className="panel muted">Loading sub builds...</div>;
  if (error) return <div className="panel error">Unable to load sub builds: {error}</div>;
  if (builds.length === 0) return <div className="panel muted">No sub builds have been added yet.</div>;

  return (
    <div className="table-wrap sub-build-table-wrap">
      <table className="sub-build-table">
        <thead>
          <tr>
            <th>Build Date</th>
            <th>ESO</th>
            {subBuildColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build) => (
            <SubBuildRow key={build.id} build={build} onUpdateStatus={onUpdateStatus} onUpdateNotes={onUpdateNotes} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubBuildRow({
  build,
  onUpdateStatus,
  onUpdateNotes,
}: {
  build: AssemblySubBuild;
  onUpdateStatus: SubBuildTableProps["onUpdateStatus"];
  onUpdateNotes: SubBuildTableProps["onUpdateNotes"];
}) {
  const [pendingCell, setPendingCell] = useState<SubBuildColumnKey | null>(null);
  const [pendingNotes, setPendingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeCount = useMemo(() => subBuildColumns.filter((column) => build[column.key] === "Complete").length, [build]);
  const requiredCount = useMemo(() => subBuildColumns.filter((column) => build[column.key] !== "N/A").length, [build]);
  const rowComplete = requiredCount > 0 && completeCount === requiredCount;

  async function updateStatus(column: SubBuildColumnKey, status: SubBuildStatus) {
    setPendingCell(column);
    setError(null);
    try {
      await onUpdateStatus(build.id, column, status);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update sub build.");
    } finally {
      setPendingCell(null);
    }
  }

  async function updateNotes(notes: string | null) {
    setPendingNotes(true);
    setError(null);
    try {
      await onUpdateNotes(build.id, notes);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update notes.");
    } finally {
      setPendingNotes(false);
    }
  }

  return (
    <tr className={rowComplete ? "row-complete" : undefined}>
      <td>
        <strong>{format(new Date(`${build.build_date}T00:00:00`), "M/d/yyyy")}</strong>
        <small>
          {completeCount}/{requiredCount} complete
        </small>
      </td>
      <td>
        <strong>{build.eso}</strong>
        {error ? <small className="error">{error}</small> : null}
      </td>
      {subBuildColumns.map((column) => (
        <td key={column.key}>
          <label className="cell-status-label">
            <StatusIcon status={build[column.key]} />
            <select
              className={clsx("sub-build-status-select", statusClass(build[column.key]))}
              value={build[column.key]}
              disabled={pendingCell === column.key}
              onChange={(event) => updateStatus(column.key, event.target.value as SubBuildStatus)}
              aria-label={`${column.label} status for ${build.eso}`}
            >
              {subBuildStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </td>
      ))}
      <td>
        <input
          className="inline-input sub-build-notes"
          defaultValue={build.notes ?? ""}
          disabled={pendingNotes}
          placeholder="None"
          onBlur={(event) => {
            const nextNotes = event.target.value.trim() || null;
            if (nextNotes !== build.notes) updateNotes(nextNotes);
          }}
        />
      </td>
    </tr>
  );
}

function StatusIcon({ status }: { status: SubBuildStatus }) {
  if (status === "Complete") return <CheckCircle2 aria-hidden="true" size={18} />;
  if (status === "N/A") return <MinusCircle aria-hidden="true" size={18} />;
  return <Circle aria-hidden="true" size={18} />;
}

function statusClass(status: SubBuildStatus) {
  if (status === "Complete") return "complete";
  if (status === "N/A") return "not-applicable";
  return "open";
}
