import { PageHeader } from "@/components/layout/PageHeader";
import { LessonLibrary } from "@/components/lessons/LessonLibrary";

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Learn the craft"
        title="Lessons"
        description="Short lessons on voice, delivery, content, and connection. Each ends with a practice set: answer a question out loud and get feedback on how well you applied the technique."
      />
      <LessonLibrary />
    </div>
  );
}
