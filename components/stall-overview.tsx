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
  const stallOrder: Stall[] = ["Head Stall", "Stall 1", "Stall 2", "Stall 3", "Stall 4", "Stall 5", "Stall 6", "Stall 7"];
  const summaries: StallSummary[] = stallOrder.map((stall) => {
    const stallParts = activeParts.filter((part) => part.stall === stall);
    const oldestPart = stallParts.reduce<MissingPart | null>((oldest, part) => {
      if (!oldest) return part;
      return minutesWaiting(part, now) > minutesWaiting(oldest, now) ? part : oldest;
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
  const overOneHour = summary.oldestPart ? minutesWaiting(summary.oldestPart, now) >= 60 : false;

  return (
    <article className="stall-card">
      <strong>{summary.stall}</strong>
      <span>
        <PackageSearch size={14} />
        {summary.count} missing {summary.count === 1 ? "part" : "parts"}
      </span>
      <span>
        <Clock size={14} />
        {summary.oldestPart ? (
          <span className={overOneHour ? "waiting-timer overdue" : "waiting-timer"}>{waitingTimerLabel(summary.oldestPart, now)}</span>
        ) : (
          "No wait"
        )}
      </span>
    </article>
  );
}
