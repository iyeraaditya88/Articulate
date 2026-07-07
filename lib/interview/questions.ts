/** Behavioral interview question bank — SWE and PM tracks. Static, zero cost. */

export type Track = "swe" | "pm";

export interface InterviewQuestion {
  id: string;
  /** which track(s) this suits */
  tracks: Track[];
  category:
    | "Conflict"
    | "Failure"
    | "Leadership"
    | "Ambiguity"
    | "Influence"
    | "Execution"
    | "Growth";
  question: string;
  /** what interviewers actually listen for — shown as a hint + fed to the grader */
  probe: string;
}

export const TRACK_LABELS: Record<Track, string> = {
  swe: "Software Engineering",
  pm: "Product Management",
};

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ——— Conflict ———
  {
    id: "swe-conflict-tech",
    tracks: ["swe"],
    category: "Conflict",
    question:
      "Tell me about a time you strongly disagreed with a teammate about a technical approach. How did you resolve it?",
    probe:
      "Do you argue from data and user impact rather than ego? Did you commit fully once a decision was made, even if it wasn't yours?",
  },
  {
    id: "pm-conflict-stakeholder",
    tracks: ["pm"],
    category: "Conflict",
    question:
      "Describe a time you had to say no to a powerful stakeholder. How did you handle it?",
    probe:
      "Can you protect the roadmap with evidence and empathy instead of either caving or burning the relationship?",
  },
  {
    id: "both-conflict-manager",
    tracks: ["swe", "pm"],
    category: "Conflict",
    question:
      "Tell me about a time you disagreed with your manager. What did you do?",
    probe:
      "Judgment and courage: did you voice disagreement constructively, escalate appropriately, and then align once heard?",
  },
  {
    id: "both-conflict-team",
    tracks: ["swe", "pm"],
    category: "Conflict",
    question:
      "Give me an example of working with a difficult colleague. How did you make the relationship productive?",
    probe:
      "Empathy and professionalism — do you seek to understand their constraints, or do you just label people 'difficult'?",
  },

  // ——— Failure ———
  {
    id: "swe-failure-incident",
    tracks: ["swe"],
    category: "Failure",
    question:
      "Walk me through a production incident you caused or owned. What happened and what changed afterwards?",
    probe:
      "Ownership without blame-shifting, calm diagnosis under pressure, and whether you improved the system — not just the fix.",
  },
  {
    id: "pm-failure-launch",
    tracks: ["pm"],
    category: "Failure",
    question:
      "Tell me about a product or feature you shipped that failed. How did you know, and what did you do?",
    probe:
      "Intellectual honesty with metrics, speed of recognizing failure, and whether you extracted a reusable lesson.",
  },
  {
    id: "both-failure-deadline",
    tracks: ["swe", "pm"],
    category: "Failure",
    question:
      "Describe a time you missed a deadline or commitment. What happened?",
    probe:
      "Do you flag risk early, communicate proactively, and renegotiate scope — or go quiet and hope?",
  },
  {
    id: "both-failure-mistake",
    tracks: ["swe", "pm"],
    category: "Failure",
    question:
      "What's the biggest professional mistake you've made, and what did it teach you?",
    probe:
      "Self-awareness and growth: a real mistake with real stakes, owned in the first person, with changed behavior since.",
  },

  // ——— Leadership ———
  {
    id: "both-lead-mentor",
    tracks: ["swe", "pm"],
    category: "Leadership",
    question:
      "Tell me about a time you helped a struggling teammate or mentored someone. What was the outcome?",
    probe:
      "Do you invest in others without being asked, diagnose the real blocker, and measure success by their growth?",
  },
  {
    id: "swe-lead-project",
    tracks: ["swe"],
    category: "Leadership",
    question:
      "Describe a project you led end-to-end. How did you keep people aligned and unblocked?",
    probe:
      "Technical leadership beyond code: clear milestones, proactive risk surfacing, and credit-sharing.",
  },
  {
    id: "pm-lead-unpopular",
    tracks: ["pm"],
    category: "Leadership",
    question:
      "Tell me about an unpopular decision you made. How did you bring people along?",
    probe:
      "Spine plus empathy: a clear decision rationale, genuine listening, and follow-through when it stayed unpopular.",
  },

  // ——— Ambiguity ———
  {
    id: "both-ambiguity-vague",
    tracks: ["swe", "pm"],
    category: "Ambiguity",
    question:
      "Tell me about a time you were handed a vague problem with no clear owner or spec. What did you do first?",
    probe:
      "Do you create structure — clarify the goal, identify stakeholders, timebox exploration — or wait for direction?",
  },
  {
    id: "pm-ambiguity-data",
    tracks: ["pm"],
    category: "Ambiguity",
    question:
      "Describe a decision you made when the data was incomplete or contradictory. How did you decide?",
    probe:
      "Comfort with judgment under uncertainty: triangulating signals, naming assumptions, and committing with a rollback plan.",
  },
  {
    id: "swe-ambiguity-newtech",
    tracks: ["swe"],
    category: "Ambiguity",
    question:
      "Tell me about a time you had to work in a codebase or technology you'd never touched, under time pressure.",
    probe:
      "Learning velocity and pragmatism — how you built a mental model fast and knew what NOT to learn yet.",
  },

  // ——— Influence ———
  {
    id: "both-influence-noauthority",
    tracks: ["swe", "pm"],
    category: "Influence",
    question:
      "Give me an example of convincing a team you had no authority over to change direction.",
    probe:
      "Influence mechanics: whose incentives you understood, what evidence you brought, and how you made it their win too.",
  },
  {
    id: "pm-influence-eng",
    tracks: ["pm"],
    category: "Influence",
    question:
      "Tell me about a time engineering pushed back hard on your priorities. How did you handle it?",
    probe:
      "Respect for technical constraints, willingness to trade scope, and whether you built durable trust with the team.",
  },
  {
    id: "swe-influence-debt",
    tracks: ["swe"],
    category: "Influence",
    question:
      "Describe a time you convinced leadership to invest in paying down technical debt or infrastructure.",
    probe:
      "Translating engineering pain into business language — risk, velocity, cost — with a concrete before/after.",
  },

  // ——— Execution ———
  {
    id: "both-exec-competing",
    tracks: ["swe", "pm"],
    category: "Execution",
    question:
      "Tell me about a time you had several urgent things due at once. How did you prioritize?",
    probe:
      "An explicit prioritization framework (impact, urgency, reversibility) and honest communication about what slipped.",
  },
  {
    id: "pm-exec-scope",
    tracks: ["pm"],
    category: "Execution",
    question:
      "Describe a time you cut scope to hit a date. What did you cut, and how did you decide?",
    probe:
      "Ruthless clarity on the core user problem, data behind the cut, and how you handled the disappointed parties.",
  },
  {
    id: "swe-exec-quality",
    tracks: ["swe"],
    category: "Execution",
    question:
      "Tell me about a time you shipped something faster than you were comfortable with. What tradeoffs did you make?",
    probe:
      "Mature risk management: what corners were consciously cut, what guardrails you added, and what you circled back to fix.",
  },
  {
    id: "pm-exec-metric",
    tracks: ["pm"],
    category: "Execution",
    question:
      "Tell me about a time you moved a key metric. What did you do, and how do you know it was your work that moved it?",
    probe:
      "Causal thinking — baseline, intervention, counterfactual — and honesty about confounds instead of metric theater.",
  },

  // ——— Growth ———
  {
    id: "both-growth-feedback",
    tracks: ["swe", "pm"],
    category: "Growth",
    question:
      "Tell me about the hardest piece of feedback you've ever received. What did you do with it?",
    probe:
      "Non-defensiveness: the feedback stung, you sat with it, and there's concrete changed behavior since — not a humble-brag.",
  },
  {
    id: "both-growth-outside",
    tracks: ["swe", "pm"],
    category: "Growth",
    question:
      "Describe a time you took on something well outside your comfort zone. How did you approach it?",
    probe:
      "Appetite for stretch, a deliberate learning plan, and asking for help early instead of drowning silently.",
  },
  {
    id: "both-growth-change",
    tracks: ["swe", "pm"],
    category: "Growth",
    question:
      "Tell me about a time you changed your mind about something important at work. What changed it?",
    probe:
      "Evidence over ego — can you name the moment new information beat your prior, and did you update publicly?",
  },
];

export function questionsForTrack(track: Track): InterviewQuestion[] {
  return INTERVIEW_QUESTIONS.filter((q) => q.tracks.includes(track));
}

export function getQuestion(id: string): InterviewQuestion | undefined {
  return INTERVIEW_QUESTIONS.find((q) => q.id === id);
}
