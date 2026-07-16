"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSupabaseConfig, isPreviewMode, supabase } from "@/lib/supabase";
import type { MissingPart, MissingPartInsert } from "@/lib/types";

export function useMissingParts() {
  const [parts, setParts] = useState<MissingPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParts = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      setParts([]);
      return;
    }

    const { data, error: fetchError } = await supabase.from("missing_parts").select("*").order("created_at", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setParts((data ?? []) as MissingPart[]);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      setLoading(true);
      await loadParts();
      if (mounted) setLoading(false);
    }

    initialLoad();

    if (!hasSupabaseConfig) return;

    const channel = supabase
      .channel("missing-parts")
      .on("postgres_changes", { event: "*", schema: "public", table: "missing_parts" }, loadParts)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadParts]);

  async function addPart(part: MissingPartInsert) {
    if (!hasSupabaseConfig) throw new Error("Supabase is not configured yet.");
    if (isPreviewMode) {
      const now = new Date().toISOString();
      const previewPart: MissingPart = {
        id: `preview-${crypto.randomUUID()}`,
        eso: part.eso,
        stall: part.stall,
        kit_context: part.kit_context,
        kit_no: part.kit_no,
        part_no: part.part_no,
        quantity: part.quantity,
        criticality: part.criticality,
        status: part.status ?? "Missing",
        eta: part.eta ?? null,
        created_at: now,
        updated_at: now,
        closed_at: null,
        timer_paused_at: null,
        paused_seconds: 0,
      };

      setParts((current) => [previewPart, ...current]);
      return;
    }

    const { error: insertError } = await supabase.from("missing_parts").insert(part);
    if (insertError) throw insertError;
    await loadParts();
  }

  async function updatePart(id: string, patch: Partial<Pick<MissingPart, "status" | "eta">>) {
    if (!hasSupabaseConfig) throw new Error("Supabase is not configured yet.");
    if (isPreviewMode) {
      const now = new Date().toISOString();
      setParts((current) =>
        current.map((part) =>
          part.id === id
            ? {
                ...part,
                ...patch,
                updated_at: now,
                closed_at:
                  patch.status === "Installed/Closed" || patch.status === "Entered by Mistake"
                    ? now
                    : patch.status
                      ? null
                      : part.closed_at,
              }
            : part,
        ),
      );
      return;
    }

    const { error: updateError } = await supabase.from("missing_parts").update(patch).eq("id", id);
    if (updateError) throw updateError;
    await loadParts();
  }

  return { parts, loading, error, addPart, updatePart, refresh: loadParts };
}
