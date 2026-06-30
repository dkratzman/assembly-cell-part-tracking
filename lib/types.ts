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

export const selectablePartStatuses = [
  "Missing",
  "Ordered",
  "Received",
  "Delivered to Stall",
  "Installed/Closed",
  "Entered by Mistake",
] as const;

export const subBuildColumns = [
  { key: "front_fuel_filters", label: "Front/FuelFilters" },
  { key: "amots", label: "AMOTs" },
  { key: "snake_coffin", label: "Snake Coffin" },
  { key: "water_manifolds", label: "Water Manifolds" },
  { key: "water_regulators", label: "Water Regulators" },
  { key: "oil_coolers", label: "Oil Coolers" },
] as const;

export const subBuildStatuses = ["Open", "Complete", "N/A"] as const;

export type Stall = (typeof stalls)[number];
export type KitContext = (typeof kitContexts)[number];
export type CriticalityLevel = (typeof criticalityLevels)[number];
export type PartStatus = (typeof partStatuses)[number];
export type SubBuildStatus = (typeof subBuildStatuses)[number];
export type SubBuildColumnKey = (typeof subBuildColumns)[number]["key"];

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
  timer_paused_at?: string | null;
  paused_seconds?: number;
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

export type AssemblySubBuild = {
  id: string;
  build_date: string;
  eso: string;
  front_fuel_filters: SubBuildStatus;
  amots: SubBuildStatus;
  snake_coffin: SubBuildStatus;
  water_manifolds: SubBuildStatus;
  water_regulators: SubBuildStatus;
  oil_coolers: SubBuildStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AssemblySubBuildInsert = Pick<AssemblySubBuild, "build_date" | "eso"> &
  Partial<Pick<AssemblySubBuild, SubBuildColumnKey | "notes">>;
