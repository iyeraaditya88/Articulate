import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";

export default function ProgressPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Watch yourself grow"
        title="Progress Tracker"
        description="Every finished session is saved on this device. Trends and coaching scores appear here as you practice."
      />
      <ProgressDashboard />
    </div>
  );
}
