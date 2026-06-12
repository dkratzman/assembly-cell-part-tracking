"use client";

import { Clock, PackageSearch } from "lucide-react";
import { useLiveNow } from "@/hooks/use-live-now";
import { activeStatuses, minutesWaiting, waitingTimerLabel } from "@/lib/parts";
import type { MissingPart, Stall } from "@/lib/types";

type StallSummary = {
  stall: Stall;
  count: number;
  oldestPart: MissingPart | null;
};

export function StallOverview({ parts }: { parts: MissingPart[] }) {
  const now = useLiveNow();
  const activeParts = parts.filter((part) => activeStatuses.includes(part.status));
  const stallOrder: Stall[] = ["Stall 6", "Stall 7", "Stall 1", "Stall 2", "Stall 3", "Stall 4", "Stall 5", "Head Stall"];
  const summaries: StallSummary[] = stallOrder.map((stall) => {
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

  return (
    <section className="stall-overview" aria-label="Stall overview">
      {summaries.map((summary) => (
        <StallCard key={summary.stall} summary={summary} now={now} />
      ))}
    </section>
  );
}

function StallCard({ summary, now }: { summary: StallSummary; now: Date }) {
  return (
    <article className="stall-card">
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
