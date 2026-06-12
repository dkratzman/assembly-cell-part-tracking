"use client";

import { Clock, PackageSearch } from "lucide-react";
import { useLiveNow } from "@/hooks/use-live-now";
import { activeStatuses, minutesWaiting, waitingTimerLabel } from "@/lib/parts";
import { stalls } from "@/lib/types";
import type { MissingPart, Stall } from "@/lib/types";

type StallSummary = {
  stall: Stall;
  count: number;
  oldestPart: MissingPart | null;
};

export function StallOverview({ parts }: { parts: MissingPart[] }) {
  const now = useLiveNow();
  const activeParts = parts.filter((part) => activeStatuses.includes(part.status));
  const summaries: StallSummary[] = stalls.map((stall) => {
    const stallParts = activeParts.filter((part) => part.stall === stall);
    const oldestPart = stallParts.reduce<MissingPart | null>((oldest, part) => {
      if (!oldest) return part;
      return minutesWaiting(part.created_at, now) > minutesWaiting(oldest.created_at, now) ? part : oldest;
    }, null);

    return {
      stall,
      count: stallParts.length,
      oldestPart,
    };
  });

  const mainStalls = summaries.filter((summary) => summary.stall !== "Stall 6" && summary.stall !== "Stall 7" && summary.stall !== "Head Stall");
  const sideStalls = summaries.filter((summary) => summary.stall === "Stall 6" || summary.stall === "Stall 7");
  const headStall = summaries.find((summary) => summary.stall === "Head Stall");

  return (
    <section className="stall-overview" aria-label="Stall overview">
      <div className="stall-side">
        {sideStalls.map((summary) => (
          <StallCard key={summary.stall} summary={summary} now={now} compact />
        ))}
      </div>

      <div className="stall-center">
        <div className="overview-title">Assembly Cell Parts Overview</div>
        <div className="stall-grid">
          {mainStalls.map((summary) => (
            <StallCard key={summary.stall} summary={summary} now={now} />
          ))}
        </div>
      </div>

      {headStall ? (
        <div className="stall-head">
          <StallCard summary={headStall} now={now} compact />
        </div>
      ) : null}
    </section>
  );
}

function StallCard({ summary, now, compact = false }: { summary: StallSummary; now: Date; compact?: boolean }) {
  return (
    <article className={compact ? "stall-card compact" : "stall-card"}>
      <strong>{summary.stall}</strong>
      <span>
        <PackageSearch size={14} />
        {summary.count} active {summary.count === 1 ? "part" : "parts"}
      </span>
      <span>
        <Clock size={14} />
        {summary.oldestPart ? waitingTimerLabel(summary.oldestPart.created_at, now) : "No wait"}
      </span>
    </article>
  );
}
