"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardTable } from "@/components/dashboard-table";
import { FilterBar, type Filters } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { useMissingParts } from "@/hooks/use-missing-parts";
import { activeStatuses, sortByPriority } from "@/lib/parts";

export default function DashboardPage() {
  const { parts, loading, error, updatePart } = useMissingParts();
  const [filters, setFilters] = useState<Filters>({ stall: "All", status: "All", criticality: "All", query: "" });

  const activeParts = useMemo(() => {
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
        eyebrow="Live controller view"
        title="Assembly Cell Dashboard"
        description="Prioritized by criticality, line-down impact, and time waiting. Anyone with the link can update status."
        action={
          <Link href="/submit" className="button primary">
            <Plus size={18} />
            New Missing Part
          </Link>
        }
      />
      <FilterBar filters={filters} onChange={setFilters} />
      <DashboardTable parts={activeParts} loading={loading} error={error} editable onUpdatePart={updatePart} />
    </section>
  );
}
