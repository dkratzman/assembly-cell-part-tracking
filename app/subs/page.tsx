"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SubBuildForm } from "@/components/sub-build-form";
import { SubBuildTable } from "@/components/sub-build-table";
import { useSubBuilds } from "@/hooks/use-sub-builds";
import { subBuildColumns } from "@/lib/types";

export default function SubsPage() {
  const { builds, loading, error, addBuild, updateBuild, updateBuildStatus } = useSubBuilds();
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const visibleBuilds = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    return builds
      .filter((build) => !dateFilter || build.build_date === dateFilter)
      .filter((build) => !normalizedQuery || build.eso.includes(normalizedQuery) || (build.notes ?? "").toUpperCase().includes(normalizedQuery));
  }, [builds, dateFilter, query]);

  const totals = useMemo(() => {
    const cells = builds.flatMap((build) => subBuildColumns.map((column) => build[column.key]));
    return {
      builds: builds.length,
      complete: cells.filter((status) => status === "Complete").length,
      open: cells.filter((status) => status === "Open").length,
      notApplicable: cells.filter((status) => status === "N/A").length,
    };
  }, [builds]);

  return (
    <section className="page subs-page">
      <PageHeader
        eyebrow="Live sub assembly tracker"
        title="Assembly Cell Subs"
        description="Daily engine sub-build list for Front/Fuel Filters, AMOTS, Snake Coffin, Water Manifolds, Water Regulators, and Oil Coolers."
      />

      <div className="sub-build-summary" aria-label="Sub build summary">
        <div>
          <span>Builds</span>
          <strong>{totals.builds}</strong>
        </div>
        <div>
          <span>Open</span>
          <strong>{totals.open}</strong>
        </div>
        <div>
          <span>Complete</span>
          <strong>{totals.complete}</strong>
        </div>
        <div>
          <span>N/A</span>
          <strong>{totals.notApplicable}</strong>
        </div>
      </div>

      <SubBuildForm onSubmitBuild={addBuild} />

      <div className="filter-bar sub-build-filter">
        <label>
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ESO or notes" />
        </label>
        <label>
          <span>Build Date</span>
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </label>
        <button className="button" type="button" onClick={() => setDateFilter("")}>
          Clear Date
        </button>
      </div>

      <SubBuildTable
        builds={visibleBuilds}
        loading={loading}
        error={error}
        onUpdateStatus={updateBuildStatus}
        onUpdateNotes={(id, notes) => updateBuild(id, { notes })}
      />
    </section>
  );
}
