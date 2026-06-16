import { ImprovementRequestForm } from "@/components/improvement-request-form";
import { PageHeader } from "@/components/page-header";

export default function ImprovementsPage() {
  return (
    <section className="page narrow">
      <PageHeader
        eyebrow="Continuous improvement"
        title="Submit Improvement"
        description="Share ideas for changes, fixes, or workflow improvements that should be reviewed for the working website."
      />
      <ImprovementRequestForm />
    </section>
  );
}
