"use client";

import { PageHeader } from "@/components/page-header";
import { SubBuildForm } from "@/components/sub-build-form";
import { SubBuildTable } from "@/components/sub-build-table";
import { useSubBuilds } from "@/hooks/use-sub-builds";

export default function SubsPage() {
  const { builds, loading, error, addBuild, updateBuildStatus } = useSubBuilds();

  return (
    <section className="page subs-page">
      <PageHeader
        eyebrow="Live sub assembly tracker"
        title="Assembly Cell Subs"
        description="Add an engine build date and ESO, then mark each sub assembly complete as technicians finish the work."
      />
      <SubBuildForm onSubmitBuild={addBuild} existingBuilds={builds} />
      <SubBuildTable builds={builds} loading={loading} error={error} onUpdateStatus={updateBuildStatus} />
    </section>
  );
}
