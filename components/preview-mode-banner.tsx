import { isPreviewMode } from "@/lib/supabase";

export function PreviewModeBanner() {
  if (!isPreviewMode) return null;

  return (
    <div className="preview-banner" role="status">
      Preview mode: changes are simulated in this browser only and are not saved to Supabase.
    </div>
  );
}
