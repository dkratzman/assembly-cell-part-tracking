"use client";

import { PageHeader } from "@/components/page-header";
import { SubmitPartForm } from "@/components/submit-part-form";
import { useMissingParts } from "@/hooks/use-missing-parts";

export default function SubmitPage() {
  const { parts, addPart } = useMissingParts();

  return (
    <section className="page narrow">
      <PageHeader
        eyebrow="Stall workstation input"
        title="Submit Missing Part"
        description="Fast entry for technicians, team leads, or controllers. Duplicate warnings appear when all identifying fields match an active request."
      />
      <SubmitPartForm existingParts={parts} onSubmitPart={addPart} />
    </section>
  );
}
