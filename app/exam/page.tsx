import { OMRSheet } from "@/components/exam/OMRSheet";
import { getClientQuestions } from "@/lib/questions";

export default function ExamPage() {
  const questions = getClientQuestions();
  return (
    <main className="min-h-screen bg-slate-50">
      <OMRSheet questions={questions} />
    </main>
  );
}
