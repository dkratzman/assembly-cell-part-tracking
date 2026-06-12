"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type { PartEvent } from "@/lib/types";

export default function HistoryPage() {
  const [events, setEvents] = useState<PartEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      if (!hasSupabaseConfig) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("part_events")
        .select("*, missing_parts(eso, stall, part_no, kit_no)")
        .order("created_at", { ascending: false })
        .limit(250);

      if (!mounted) return;
      if (fetchError) setError(fetchError.message);
      else setEvents((data ?? []) as PartEvent[]);
      setLoading(false);
    }

    loadEvents();

    if (!hasSupabaseConfig) return;

    const channel = supabase
      .channel("history")
      .on("postgres_changes", { event: "*", schema: "public", table: "part_events" }, loadEvents)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Audit trail"
        title="History Log"
        description="Status and ETA changes are recorded here for traceability without crowding the main dashboard."
      />

      <div className="panel">
        {loading ? <p className="muted">Loading history...</p> : null}
        {error ? <p className="error">Unable to load history: {error}</p> : null}
        {!loading && !error && events.length === 0 ? <p className="muted">No history yet.</p> : null}
        {events.length > 0 ? (
          <div className="history-list">
            {events.map((event) => (
              <article className="history-item" key={event.id}>
                <div>
                  <strong>
                    {event.missing_parts?.part_no ?? "Part"} · {event.missing_parts?.eso ?? "ESO"}
                  </strong>
                  <p>
                    {event.event_type === "created"
                      ? `Created as ${event.to_status}`
                      : `${event.from_status ?? "Unknown"} → ${event.to_status ?? "Updated"}`}
                  </p>
                </div>
                <div className="history-meta">
                  <span>{event.missing_parts?.stall}</span>
                  <time>{format(new Date(event.created_at), "MMM d, h:mm a")}</time>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
