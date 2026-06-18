"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { FilterBar, type Filters } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { elapsedTimeLabel } from "@/lib/parts";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type { MissingPart } from "@/lib/types";

export default function ClosedPartsPage() {
  const [parts, setParts] = useState<MissingPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ stall: "All", status: "All", criticality: "All", query: "" });

  const visibleParts = useMemo(() => {
    const query = filters.query.trim().toUpperCase();
    return parts
      .filter((part) => filters.stall === "All" || part.stall === filters.stall)
      .filter((part) => filters.status === "All" || part.status === filters.status)
      .filter((part) => filters.criticality === "All" || part.criticality === filters.criticality)
      .filter((part) => {
        if (!query) return true;
        return [part.eso, part.part_no, part.kit_no ?? "", part.stall].some((value) => value.toUpperCase().includes(query));
      });
  }, [filters, parts]);

  useEffect(() => {
    let mounted = true;

    async function loadClosedParts() {
      if (!hasSupabaseConfig) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("missing_parts")
        .select("*")
        .eq("status", "Installed/Closed")
        .order("closed_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });

      if (!mounted) return;
      if (fetchError) setError(fetchError.message);
      else {
        setParts((data ?? []) as MissingPart[]);
        setError(null);
      }
      setLoading(false);
    }

    loadClosedParts();

    if (!hasSupabaseConfig) return;

    const channel = supabase
      .channel("closed-parts")
      .on("postgres_changes", { event: "*", schema: "public", table: "missing_parts" }, loadClosedParts)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Closed parts"
        title="Closed Log"
        description="Installed and closed parts are kept here with their submitted, closed, and elapsed times."
      />

      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? <div className="panel muted">Loading closed parts...</div> : null}
      {error ? <div className="panel error">Unable to load closed parts: {error}</div> : null}
      {!loading && !error && parts.length === 0 ? <div className="panel muted">No closed parts yet.</div> : null}
      {!loading && !error && parts.length > 0 && visibleParts.length === 0 ? <div className="panel muted">No closed parts match these filters.</div> : null}

      {visibleParts.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Part</th>
                <th>Kit / Context</th>
                <th>ESO</th>
                <th>Stall</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Closed</th>
                <th>Time to Close</th>
              </tr>
            </thead>
            <tbody>
              {visibleParts.map((part) => {
                const closedAt = part.closed_at ?? part.updated_at;

                return (
                  <tr key={part.id}>
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
                      <StatusPill part={part} />
                    </td>
                    <td>{format(new Date(part.created_at), "MMM d, h:mm a")}</td>
                    <td>{format(new Date(closedAt), "MMM d, h:mm a")}</td>
                    <td>
                      <span className="waiting-timer">{elapsedTimeLabel(part.created_at, closedAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
