"use client";

import { SubBuildForm } from "@/components/sub-build-form";
import { SubBuildTable } from "@/components/sub-build-table";
import { useSubBuilds } from "@/hooks/use-sub-builds";

export default function SubsPage() {
  const { builds, loading, error, addBuild, updateBuildStatus } = useSubBuilds();

  return (
    <section className="page subs-page">
      <h2 className="subs-title">Assembly Cell Subs Page</h2>
      <SubBuildTable builds={builds} loading={loading} error={error} onUpdateStatus={updateBuildStatus} />
      <SubBuildForm onSubmitBuild={addBuild} existingBuilds={builds} />
    </section>
  );
}
