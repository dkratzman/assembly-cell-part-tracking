export const stalls = [
  "Stall 1",
  "Stall 2",
  "Stall 3",
  "Stall 4",
  "Stall 5",
  "Stall 6",
  "Stall 7",
  "Head Stall",
] as const;

export const kitContexts = ["Kit", "Subassembly", "Part Only", "Unknown"] as const;

export const criticalityLevels = ["Normal", "Critical"] as const;

export const partStatuses = [
  "Missing",
  "Ordered",
  "ETA Set",
  "En Route",
  "Received",
  "Delivered to Stall",
  "Installed/Closed",
  "Entered by Mistake",
] as const;

export type Stall = (typeof stalls)[number];
export type KitContext = (typeof kitContexts)[number];
export type CriticalityLevel = (typeof criticalityLevels)[number];
export type PartStatus = (typeof partStatuses)[number];

export type MissingPart = {
  id: string;
  eso: string;
  stall: Stall;
  kit_context: KitContext;
  kit_no: string | null;
  part_no: string;
  quantity: number;
  criticality: CriticalityLevel;
  status: PartStatus;
  eta: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type PartEvent = {
  id: string;
  part_id: string;
  event_type: string;
  from_status: PartStatus | null;
  to_status: PartStatus | null;
  details: Record<string, unknown>;
  created_at: string;
  missing_parts?: Pick<MissingPart, "eso" | "stall" | "part_no" | "kit_no"> | null;
};

export type MissingPartInsert = Pick<
  MissingPart,
  "eso" | "stall" | "kit_context" | "kit_no" | "part_no" | "quantity" | "criticality"
> & {
  status?: PartStatus;
  eta?: string | null;
};

export const improvementAreas = ["Missing Part Flow", "Monitor Screen", "Dashboard", "History", "Other"] as const;

export type ImprovementArea = (typeof improvementAreas)[number];

export type ImprovementRequest = {
  id: string;
  title: string;
  area: ImprovementArea;
  description: string;
  submitted_by: string | null;
  contact: string | null;
  status: "New" | "Reviewing" | "Accepted" | "Added" | "Declined";
  created_at: string;
  updated_at: string;
};

export type ImprovementRequestInsert = Pick<ImprovementRequest, "title" | "area" | "description" | "submitted_by" | "contact">;
