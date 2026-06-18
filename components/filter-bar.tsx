"use client";

import { criticalityLevels, selectablePartStatuses, stalls } from "@/lib/types";
import type { CriticalityLevel, PartStatus, Stall } from "@/lib/types";

export type Filters = {
  stall: Stall | "All";
  status: PartStatus | "All";
  criticality: CriticalityLevel | "All";
  query: string;
};

type FilterBarProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <label>
        <span>Search</span>
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="ESO, part, kit, stall"
        />
      </label>
      <label>
        <span>Stall</span>
        <select value={filters.stall} onChange={(event) => onChange({ ...filters, stall: event.target.value as Filters["stall"] })}>
          <option>All</option>
          {stalls.map((stall) => (
            <option key={stall}>{stall}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as Filters["status"] })}>
          <option>All</option>
          {selectablePartStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Priority</span>
        <select
          value={filters.criticality}
          onChange={(event) => onChange({ ...filters, criticality: event.target.value as Filters["criticality"] })}
        >
          <option>All</option>
          {criticalityLevels.map((level) => (
            <option key={level}>{level}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
