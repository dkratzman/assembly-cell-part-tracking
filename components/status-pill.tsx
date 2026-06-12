import clsx from "clsx";
import { statusTone } from "@/lib/parts";
import type { MissingPart } from "@/lib/types";

export function StatusPill({ part }: { part: MissingPart }) {
  return <span className={clsx("status-pill", statusTone(part))}>{part.status}</span>;
}
