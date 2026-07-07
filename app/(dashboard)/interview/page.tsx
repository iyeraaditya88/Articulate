import { PageHeader } from "@/components/layout/PageHeader";
import { InterviewPractice } from "@/components/interview/InterviewPractice";

export default function InterviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Ace the room"
        title="Interview Practice"
        description="Behavioral interview prep for software engineers and product managers. Answer a real question out loud, get a hiring-manager-style debrief against the STAR framework — and hear your own story told the strong way."
      />
      <InterviewPractice />
    </div>
  );
}
