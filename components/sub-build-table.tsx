"use client";

import { useState } from "react";
import { format } from "date-fns";
import clsx from "clsx";
import { subBuildColumns } from "@/lib/types";
import type { AssemblySubBuild, SubBuildColumnKey, SubBuildStatus } from "@/lib/types";

type SubBuildTableProps = {
  builds: AssemblySubBuild[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (id: string, column: SubBuildColumnKey, status: SubBuildStatus) => Promise<void>;
};

export function SubBuildTable({ builds, loading, error, onUpdateStatus }: SubBuildTableProps) {
  if (loading) return <div className="panel muted">Loading sub builds...</div>;
  if (error) return <div className="panel error">Unable to load sub builds: {error}</div>;

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
          </tr>
        </thead>
        <tbody>
          {builds.length === 0 ? (
            <tr>
              <td className="sub-empty-row" colSpan={subBuildColumns.length + 2}>
                No ESOs have been added yet.
              </td>
            </tr>
          ) : (
            builds.map((build) => <SubBuildRow key={build.id} build={build} onUpdateStatus={onUpdateStatus} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function SubBuildRow({
  build,
  onUpdateStatus,
}: {
  build: AssemblySubBuild;
  onUpdateStatus: SubBuildTableProps["onUpdateStatus"];
}) {
  const [pendingCell, setPendingCell] = useState<SubBuildColumnKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(column: SubBuildColumnKey, status: SubBuildStatus) {
    if (build[column] === "N/A") return;
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

  return (
    <tr>
      <td>
        {format(new Date(`${build.build_date}T00:00:00`), "M/d/yyyy")}
      </td>
      <td>
        {build.eso}
        {error ? <small className="error">{error}</small> : null}
      </td>
      {subBuildColumns.map((column) => (
        <SubBuildCell
          key={column.key}
          column={column.key}
          label={column.label}
          build={build}
          pending={pendingCell === column.key}
          onUpdateStatus={updateStatus}
        />
      ))}
    </tr>
  );
}

function SubBuildCell({
  build,
  column,
  label,
  pending,
  onUpdateStatus,
}: {
  build: AssemblySubBuild;
  column: SubBuildColumnKey;
  label: string;
  pending: boolean;
  onUpdateStatus: (column: SubBuildColumnKey, status: SubBuildStatus) => Promise<void>;
}) {
  const status = build[column];
  const nextStatus = status === "Complete" ? "Open" : "Complete";

  return (
    <td>
      <button
        className={clsx("sub-status-button", statusClass(status))}
        type="button"
        disabled={pending || status === "N/A"}
        onClick={() => onUpdateStatus(column, nextStatus)}
        aria-label={`${label} for ${build.eso}: ${status}. Click to mark ${nextStatus}.`}
      >
        {statusLabel(status)}
      </button>
    </td>
  );
}

function statusLabel(status: SubBuildStatus) {
  if (status === "Complete") return "Complete";
  if (status === "N/A") return "N/A";
  return "Not Built";
}

function statusClass(status: SubBuildStatus) {
  if (status === "Complete") return "complete";
  if (status === "N/A") return "not-applicable";
  return "open";
}
