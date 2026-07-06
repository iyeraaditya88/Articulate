import { PageHeader } from "@/components/layout/PageHeader";
import { PracticeRoom } from "@/components/practice/PracticeRoom";

export default function PracticePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Step on stage"
        title="Trial Room"
        description="Record yourself speaking. Articulate measures your prosody, volume, pace, and pauses locally in your browser — nothing is uploaded until you ask for an analysis."
      />
      <PracticeRoom />
    </div>
  );
}
