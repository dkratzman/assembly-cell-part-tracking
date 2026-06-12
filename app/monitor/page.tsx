"use client";

import { useMemo, useState } from "react";
import { DashboardTable } from "@/components/dashboard-table";
import { FilterBar, type Filters } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { StallOverview } from "@/components/stall-overview";
import { useMissingParts } from "@/hooks/use-missing-parts";
import { activeStatuses, sortByPriority } from "@/lib/parts";

export default function MonitorPage() {
  const { parts, loading, error } = useMissingParts();
  const [filters, setFilters] = useState<Filters>({ stall: "All", status: "All", criticality: "All", query: "" });

  const visibleParts = useMemo(() => {
    const query = filters.query.trim().toUpperCase();
    return sortByPriority(parts)
      .filter((part) => activeStatuses.includes(part.status))
      .filter((part) => filters.stall === "All" || part.stall === filters.stall)
      .filter((part) => filters.status === "All" || part.status === filters.status)
      .filter((part) => filters.criticality === "All" || part.criticality === filters.criticality)
      .filter((part) => {
        if (!query) return true;
        return [part.eso, part.part_no, part.kit_no ?? "", part.stall].some((value) => value.toUpperCase().includes(query));
      });
  }, [filters, parts]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Read-only view"
        title="Monitor"
        description="A simple live view for team leads, supervisors, and leadership."
      />
      <StallOverview parts={parts} />
      <FilterBar filters={filters} onChange={setFilters} />
      <DashboardTable parts={visibleParts} loading={loading} error={error} editable={false} />
    </section>
  );
}
