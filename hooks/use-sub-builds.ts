"use client";

import { useCallback, useEffect, useState } from "react";
import { hasSupabaseConfig, isPreviewMode, supabase } from "@/lib/supabase";
import type { AssemblySubBuild, AssemblySubBuildInsert, SubBuildColumnKey, SubBuildStatus } from "@/lib/types";

type SubBuildPatch = Partial<Pick<AssemblySubBuild, SubBuildColumnKey | "notes">>;

export function useSubBuilds() {
  const [builds, setBuilds] = useState<AssemblySubBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBuilds = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      setBuilds([]);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("assembly_sub_builds")
      .select("*")
      .order("build_date", { ascending: true })
      .order("eso", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setBuilds((data ?? []) as AssemblySubBuild[]);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      setLoading(true);
      await loadBuilds();
      if (mounted) setLoading(false);
    }

    initialLoad();

    if (!hasSupabaseConfig) return;

    const channel = supabase
      .channel("assembly-sub-builds")
      .on("postgres_changes", { event: "*", schema: "public", table: "assembly_sub_builds" }, loadBuilds)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [loadBuilds]);

  async function addBuild(build: AssemblySubBuildInsert) {
    if (!hasSupabaseConfig) throw new Error("Supabase is not configured yet.");
    if (isPreviewMode) {
      const now = new Date().toISOString();
      const previewBuild: AssemblySubBuild = {
        id: `preview-${crypto.randomUUID()}`,
        build_date: build.build_date,
        eso: build.eso,
        front_fuel_filters: build.front_fuel_filters ?? "Open",
        amots: build.amots ?? "Open",
        snake_coffin: build.snake_coffin ?? "Open",
        water_manifolds: build.water_manifolds ?? "Open",
        water_regulators: build.water_regulators ?? "Open",
        oil_coolers: build.oil_coolers ?? "Open",
        notes: build.notes ?? null,
        created_at: now,
        updated_at: now,
      };

      setBuilds((current) =>
        [...current, previewBuild].sort((a, b) => a.build_date.localeCompare(b.build_date) || a.eso.localeCompare(b.eso)),
      );
      return;
    }

    const { error: insertError } = await supabase.from("assembly_sub_builds").insert(build);
    if (insertError) throw insertError;
    await loadBuilds();
  }

  async function updateBuild(id: string, patch: SubBuildPatch) {
    if (!hasSupabaseConfig) throw new Error("Supabase is not configured yet.");
    if (isPreviewMode) {
      const now = new Date().toISOString();
      setBuilds((current) => current.map((build) => (build.id === id ? { ...build, ...patch, updated_at: now } : build)));
      return;
    }

    const { error: updateError } = await supabase.from("assembly_sub_builds").update(patch).eq("id", id);
    if (updateError) throw updateError;
    await loadBuilds();
  }

  async function updateBuildStatus(id: string, column: SubBuildColumnKey, status: SubBuildStatus) {
    await updateBuild(id, { [column]: status } as SubBuildPatch);
  }

  return { builds, loading, error, addBuild, updateBuild, updateBuildStatus, refresh: loadBuilds };
}
