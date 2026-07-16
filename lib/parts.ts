import { differenceInMinutes, differenceInSeconds, parseISO } from "date-fns";
import type { CriticalityLevel, MissingPart, PartStatus } from "@/lib/types";

export const activeStatuses: PartStatus[] = [
  "Missing",
  "Ordered",
  "ETA Set",
  "En Route",
  "Received",
];

export const closedStatuses: PartStatus[] = ["Installed/Closed", "Entered by Mistake"];

export const timerStoppedStatuses: PartStatus[] = ["Delivered to Stall", "Installed/Closed"];

export function isClosed(status: PartStatus) {
  return closedStatuses.includes(status);
}

export function isTimerStopped(status: PartStatus) {
  return timerStoppedStatuses.includes(status);
}

function pausedSeconds(part: MissingPart) {
  return Math.max(0, part.paused_seconds ?? 0);
}

function timerEndDate(part: MissingPart, now = new Date()) {
  if (part.timer_paused_at) return parseISO(part.timer_paused_at);
  if (part.status === "Installed/Closed" && part.closed_at) return parseISO(part.closed_at);
  if (isTimerStopped(part.status)) return parseISO(part.updated_at);
  return now;
}

export function elapsedSeconds(part: MissingPart, now = new Date()) {
  return Math.max(0, differenceInSeconds(timerEndDate(part, now), parseISO(part.created_at)) - pausedSeconds(part));
}

export function elapsedSecondsBetween(startAt: string, endAt: string | Date) {
  const end = typeof endAt === "string" ? parseISO(endAt) : endAt;
  return Math.max(0, differenceInSeconds(end, parseISO(startAt)));
}

export function formatElapsedSeconds(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const twoDigit = (value: number) => value.toString().padStart(2, "0");

  if (days > 0) return `${days}d ${twoDigit(hours)}:${twoDigit(minutes)}:${twoDigit(seconds)}`;
  if (hours > 0) return `${hours}:${twoDigit(minutes)}:${twoDigit(seconds)}`;
  return `${minutes}:${twoDigit(seconds)}`;
}

export function minutesWaiting(part: MissingPart, now = new Date()) {
  return Math.floor(elapsedSeconds(part, now) / 60);
}

export function waitingTimerLabel(part: MissingPart, now = new Date()) {
  return formatElapsedSeconds(elapsedSeconds(part, now));
}

export function elapsedTimeLabel(startAt: string, endAt: string | Date) {
  return formatElapsedSeconds(elapsedSecondsBetween(startAt, endAt));
}

export function urgencyScore(part: MissingPart, now = new Date()) {
  const criticalityWeight: Record<CriticalityLevel, number> = {
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

  return criticalityWeight[part.criticality] + statusWeight[part.status] + minutesWaiting(part, now);
}

export function isUrgent(part: MissingPart, now = new Date()) {
  return part.criticality !== "Normal" || minutesWaiting(part, now) >= 60;
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
