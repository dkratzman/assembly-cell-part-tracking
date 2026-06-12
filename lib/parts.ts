import { differenceInMinutes, formatDistanceToNowStrict, parseISO } from "date-fns";
import type { CriticalityLevel, MissingPart, PartStatus } from "@/lib/types";

export const activeStatuses: PartStatus[] = [
  "Missing",
  "Ordered",
  "ETA Set",
  "En Route",
  "Received",
  "Delivered to Stall",
];

export const closedStatuses: PartStatus[] = ["Installed/Closed", "Entered by Mistake"];

export function isClosed(status: PartStatus) {
  return closedStatuses.includes(status);
}

export function minutesWaiting(createdAt: string) {
  return differenceInMinutes(new Date(), parseISO(createdAt));
}

export function waitingLabel(createdAt: string) {
  return formatDistanceToNowStrict(parseISO(createdAt), { addSuffix: false });
}

export function urgencyScore(part: MissingPart) {
  const criticalityWeight: Record<CriticalityLevel, number> = {
    "Line Down": 3000,
    Critical: 2000,
    Normal: 0,
  };
  const statusWeight: Record<PartStatus, number> = {
    Missing: 500,
    Ordered: 300,
    "ETA Set": 250,
    "En Route": 200,
    Received: 125,
    "Delivered to Stall": -500,
    "Installed/Closed": -1000,
    "Entered by Mistake": -1000,
  };

  return criticalityWeight[part.criticality] + statusWeight[part.status] + minutesWaiting(part.created_at);
}

export function isUrgent(part: MissingPart) {
  return part.criticality !== "Normal" || minutesWaiting(part.created_at) >= 60;
}

export function statusTone(part: MissingPart) {
  if (part.status === "Delivered to Stall" || part.status === "Installed/Closed") return "green";
  if (isUrgent(part) && part.status !== "Received") return "red";
  if (part.status === "Ordered" || part.status === "ETA Set" || part.status === "En Route") return "yellow";
  if (part.status === "Received") return "blue";
  if (part.status === "Entered by Mistake") return "muted";
  return "neutral";
}

export function sortByPriority(parts: MissingPart[]) {
  return [...parts].sort((a, b) => urgencyScore(b) - urgencyScore(a));
}

export function normalizeEntryValue(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export function isDuplicateCandidate(a: MissingPart, b: Pick<MissingPart, "eso" | "stall" | "kit_context" | "kit_no" | "part_no">) {
  return (
    normalizeEntryValue(a.eso) === normalizeEntryValue(b.eso) &&
    normalizeEntryValue(a.stall) === normalizeEntryValue(b.stall) &&
    normalizeEntryValue(a.kit_context) === normalizeEntryValue(b.kit_context) &&
    normalizeEntryValue(a.kit_no) === normalizeEntryValue(b.kit_no) &&
    normalizeEntryValue(a.part_no) === normalizeEntryValue(b.part_no) &&
    !isClosed(a.status)
  );
}
