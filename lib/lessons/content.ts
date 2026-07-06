/** Static lesson library — curated content, zero API cost to serve. */

export interface Lesson {
  slug: string;
  title: string;
  category: "Voice" | "Delivery" | "Content" | "Connection";
  /** which radar axis this trains, for linking from analysis */
  trains: string;
  tagline: string;
  /** teaching content */
  sections: { heading: string; body: string }[];
  /** solo exercises to do before recording */
  drills: string[];
  /** practice questions — the user records an answer to one */
  questions: string[];
  /** what the feedback engine should evaluate, in plain language */
  evaluationFocus: string;
}

export const LESSONS: Lesson[] = [
  {
    slug: "melodic-range",
    title: "Melodic Range",
    category: "Voice",
    trains: "Vocal Variety",
    tagline: "Escape the monotone — make your voice rise and fall with meaning.",
    sections: [
      {
        heading: "Why monotone kills attention",
        body: "Listeners' brains tune out steady signals — a flat pitch reads as 'nothing new here' and attention drifts within seconds. Julian Treasure calls prosody the sing-song of speech: it is how we signal meaning beyond words. A question rises. A conclusion lands low and slow. Emphasis jumps.",
      },
      {
        heading: "Your pitch is a highlighter",
        body: "You cannot highlight every word — that is shouting. Pick the one word in each sentence that carries the meaning and let your pitch move on it. 'I NEVER said she stole it' means seven different things depending on which word you lift.",
      },
      {
        heading: "The target",
        body: "Engaging speakers vary their pitch by roughly 2-4 semitones around their base. Under 1.5 reads flat. You don't need to be a performer — you need deliberate movement at the moments that matter: openings, key claims, and closings.",
      },
      {
        heading: "Downward inflection = authority",
        body: "Ending statements on a rising pitch ('uptalk') makes claims sound like questions and undercuts authority. Let your pitch fall at the end of declarative sentences — it signals certainty and gives listeners a place to rest.",
      },
    ],
    drills: [
      "Say 'I never said she stole it' seven times, stressing a different word each time. Hear how the meaning changes.",
      "Read one paragraph of anything aloud twice: once deliberately flat, once exaggerating the melody like a children's storyteller. Your natural target is between the two, closer to the storyteller.",
      "Hum a siren from your lowest comfortable note to your highest and back, three times. This wakes up your usable range before speaking.",
    ],
    questions: [
      "Describe the most exciting moment you've experienced in the last year — make us feel the excitement in your voice.",
      "Tell me about a movie or book you love, and one you couldn't finish. Let your voice show the contrast.",
      "Explain something you know well to a curious 10-year-old — keep the melody alive.",
    ],
    evaluationFocus:
      "Pitch variation is the whole game here. Judge stdDevSemitones (target 2-4 st, under 1.5 is flat), rangeSemitones, and whether emphasis lands on meaningful words. Content matters only as a vehicle — grade the melody.",
  },
  {
    slug: "power-of-pause",
    title: "The Power of the Pause",
    category: "Delivery",
    trains: "Pauses",
    tagline: "Silence is not empty — it's where your message sinks in.",
    sections: [
      {
        heading: "The fear of silence",
        body: "Most speakers fill every gap with 'um' or rush onward because a second of silence feels like an eternity from the inside. From the outside, it reads as composure. Great speakers pause twice as long as average ones — and are rated as MORE confident for it.",
      },
      {
        heading: "Three pauses, three jobs",
        body: "The comma pause (~0.5s) separates ideas. The period pause (~1s) closes a thought and lets it register. The dramatic pause (1.5-2s) comes BEFORE your key line — it creates a vacuum of attention that your next words fill.",
      },
      {
        heading: "Pause instead of filler",
        body: "Every 'um' is a pause that lost its nerve. When you feel a filler coming, close your mouth. The silence does the same job — buying you thinking time — while sounding deliberate instead of hesitant.",
      },
      {
        heading: "Landing the close",
        body: "The last sentence of anything deserves a pause before it. 'And that's why... [pause] ...this matters.' Rushing your close tells the audience it didn't matter.",
      },
    ],
    drills: [
      "Read a paragraph aloud and replace every comma and period with a silent count: 'one' for commas, 'one-two' for periods. It will feel absurdly slow. It sounds right.",
      "Record yourself answering 'What did you do today?' — then answer again with a deliberate 1-second pause before your most interesting detail.",
      "Practice the pre-punchline pause: set up any statement, count two full seconds of silence, then deliver the key line.",
    ],
    questions: [
      "Make an argument for a change you'd like to see at your work or in your city — pause deliberately before each key point.",
      "Tell a short story with a reveal or twist at the end. Use silence to set up the reveal.",
      "Give a 45-second toast for someone you admire. Let the pauses carry the weight.",
    ],
    evaluationFocus:
      "Judge pause usage: interior pause count and mean length (deliberate pauses over 500ms are good here, not hesitation), low filler count (fillers are failed pauses), speaking ratio not too high (over ~92% means no room to breathe), and whether pauses precede key statements in the transcript's structure.",
  },
  {
    slug: "pace-control",
    title: "Pace Control",
    category: "Delivery",
    trains: "Pace",
    tagline: "Speed is a signal — control it instead of letting adrenaline drive.",
    sections: [
      {
        heading: "The nervous sprint",
        body: "Under pressure, speech speeds up and listeners fall behind. Conversational comprehension is comfortable at 140-170 words per minute. Above 190, listeners spend effort keeping up instead of absorbing; below 110, attention wanders.",
      },
      {
        heading: "Vary, don't fix",
        body: "One steady pace — even a good one — becomes wallpaper. Speed up slightly through familiar or exciting material; slow down hard for the important, the complex, and the emotional. The slowdown IS the highlight.",
      },
      {
        heading: "Slow is a flex",
        body: "Speaking slowly on a key point signals: I know you're listening, and I'm not afraid of the space this takes. Rushing signals the opposite — that you fear losing the floor.",
      },
      {
        heading: "Breath is the throttle",
        body: "You cannot rush while breathing low and slow. Before speaking, one deep belly breath; at each major transition, another. Pace problems are usually breath problems.",
      },
    ],
    drills: [
      "Read 150 words of any text against a 60-second timer — that's 150 wpm. Repeat until you can feel the tempo without the timer.",
      "Explain your morning routine twice: once as fast as you can, once at half that speed. Notice where the slow version actually sounds better.",
      "Pick three sentences; deliver each with a deliberate slowdown on its most important word.",
    ],
    questions: [
      "Explain a process you know by heart — a recipe, a workout, a workflow — varying pace between routine steps and critical ones.",
      "Describe a moment when everything happened fast. Narrate the fast parts briskly, then slow right down for the turning point.",
      "Teach me one concept from your field. Take your time where it gets complex.",
    ],
    evaluationFocus:
      "Judge words per minute against the 140-170 sweet spot, and reward evidence of deliberate variation (from transcript structure and pause placement). Penalize a uniform sprint or drag, not deviation with purpose.",
  },
  {
    slug: "projection-presence",
    title: "Projection & Presence",
    category: "Voice",
    trains: "Projection",
    tagline: "Fill the room without shouting — volume as confidence made audible.",
    sections: [
      {
        heading: "Volume is commitment",
        body: "A voice that trails off says 'I'm not sure I should be saying this.' Steady, well-supported volume says the opposite before your words say anything. Projection isn't loudness — it's a voice carried by breath instead of squeezed from the throat.",
      },
      {
        heading: "Breathe from the floor",
        body: "Put a hand on your belly: it should push OUT as you inhale. That low breath is the engine of projection. Chest-breathing gives you ten weak words per breath; belly-breathing gives you twenty strong ones.",
      },
      {
        heading: "Don't fade at the finish",
        body: "The most common projection failure is the sentence that dies — strong start, mumbled ending. Your last three words carry your point; give them the same air as your first three.",
      },
      {
        heading: "Dynamics, not just level",
        body: "Dropping quieter can pull listeners in ('lean in — this part is just for you') and lifting louder can rally them. A 4-8 dB swing while speaking is lively; dead-flat volume is as monotone as dead-flat pitch.",
      },
    ],
    drills: [
      "Count to ten on one breath, keeping number ten as strong as number one.",
      "Say the same sentence to an imaginary person 1 meter, 5 meters, and 15 meters away — feel the breath, not the throat, do the work.",
      "Read a paragraph and deliberately finish every sentence louder than you started it. (Overcorrection — your habit will meet it in the middle.)",
    ],
    questions: [
      "Deliver a 45-second announcement to a full room without a microphone — introduce an event you care about.",
      "Argue passionately for an unpopular opinion you hold. Keep the energy through the ends of your sentences.",
      "Read or recite something you find moving, using volume shifts — quiet where intimate, full where it soars.",
    ],
    evaluationFocus:
      "Judge mean speaking level (not tooQuiet), volume dynamics (stdDevDb — some movement is good), no clipping, and especially whether energy holds through sentence endings (infer from transcript completeness and pause structure).",
  },
  {
    slug: "kill-the-fillers",
    title: "Kill the Fillers",
    category: "Delivery",
    trains: "Conciseness",
    tagline: "Um, like, basically — reclaim the words that dilute you.",
    sections: [
      {
        heading: "What fillers cost",
        body: "A few fillers are human. But past roughly three per minute they become the signal: listeners start hearing the 'um' instead of the idea, and credibility drains with each one. Fillers say 'I haven't finished thinking' — even when you have.",
      },
      {
        heading: "Fillers are symptoms",
        body: "You don't fix fillers by banning them; they're symptoms of racing ahead of your own thoughts. Slow down 10%, pause at boundaries, and know your first and last sentences cold — most fillers evaporate.",
      },
      {
        heading: "The hedge words",
        body: "'Sort of', 'kind of', 'basically', 'just', 'I think maybe' — hedges are fillers' cousins. They soften claims you should either make or not make. 'This basically works' invites doubt; 'this works' invites trust.",
      },
      {
        heading: "The swap",
        body: "Every filler marks a spot where a pause belongs. When you catch one forming, stop, breathe, continue. The discipline feels brutal for a week and then becomes your default.",
      },
    ],
    drills: [
      "Speak for 60 seconds about your day. Every time you hear yourself say a filler, clap once and continue. Awareness is 80% of the cure.",
      "Answer any question three times in a row. By round three, the thinking is done and the fillers are gone — notice the difference preparation makes.",
      "Practice the swap: deliberately begin an answer with 2 seconds of silence instead of 'so, um'.",
    ],
    questions: [
      "Off the cuff: what's a skill everyone should learn, and why? No preparation — manage the fillers in real time.",
      "Describe your work or studies to a stranger, with zero hedging — make every claim like you mean it.",
      "Explain why you chose where you live. When you need to think, pause silently instead of filling.",
    ],
    evaluationFocus:
      "Count fillers and hedges in the transcript precisely — this lesson lives or dies on it. Under 1 per minute is excellent, 1-3 acceptable, over 3 is the problem to name. Also credit silent pauses used where fillers would have been (pauses present + few fillers = the technique working).",
  },
  {
    slug: "structure-first",
    title: "Structure First",
    category: "Content",
    trains: "Clarity",
    tagline: "Say what you're going to say — the oldest trick still works.",
    sections: [
      {
        heading: "The listener can't rewind",
        body: "Readers can re-read; listeners get one pass. Structure is how you make one pass enough: tell them where you're going, take them there, tell them where they've been.",
      },
      {
        heading: "PREP in the wild",
        body: "For any answer under two minutes: Point ('Remote work makes teams stronger'), Reason ('because trust replaces surveillance'), Example ('my last team shipped faster after going remote'), Point again ('that's why I'd default to remote'). Four beats, impossible to lose.",
      },
      {
        heading: "One idea per sentence",
        body: "Spoken sentences that chain three clauses with 'and... which... so...' lose the listener mid-journey. Short sentences land. Full stop. Then the next one.",
      },
      {
        heading: "Signpost out loud",
        body: "'Three reasons. First...' — verbal signposts feel mechanical to say and sound masterful to hear. They hand the listener a map, and a listener with a map relaxes and absorbs.",
      },
    ],
    drills: [
      "Take any opinion you hold and force it through PREP out loud in under 45 seconds.",
      "Explain your last project in exactly three sentences: what, why, result. Cut until it fits.",
      "Practice opening with the conclusion: answer 'How was your week?' with the headline first, details second.",
    ],
    questions: [
      "Should social media require identity verification? Answer with a clear position using the PREP structure.",
      "Explain a decision you made recently: the situation, your options, why you chose what you chose — with clear signposts.",
      "Pitch an idea for improving your neighborhood in under 90 seconds: hook, three points, close.",
    ],
    evaluationFocus:
      "Judge structure from the transcript: is there a clear point up front, ordered support, signpost language, and a deliberate close? Reward PREP-shaped answers and short sentences; penalize rambling chains and buried leads. Delivery metrics are secondary here.",
  },
  {
    slug: "storytelling-hooks",
    title: "Storytelling & Hooks",
    category: "Content",
    trains: "Engagement",
    tagline: "Facts inform, stories move — put a person and a problem in it.",
    sections: [
      {
        heading: "The brain runs on story",
        body: "Give a listener data and their brain evaluates; give them a story and their brain simulates — they're IN it. The unit of engagement is: a person, who wanted something, hit an obstacle, and something changed.",
      },
      {
        heading: "Hooks buy you thirty seconds",
        body: "Openings decide whether attention is granted. 'Let me tell you about the worst meeting of my life' beats 'Today I want to talk about meetings.' Start with the moment, a question, or a surprising claim — never with throat-clearing.",
      },
      {
        heading: "Specific beats general",
        body: "'A customer complained' is forgettable. 'A customer called at 11pm, furious, from an airport in Denver' is a scene. Concrete nouns, real numbers, sensory details — specificity is the price of being believed and remembered.",
      },
      {
        heading: "The so-what landing",
        body: "A story without a point is an anecdote. Land it: 'and that's when I learned...' or 'which is exactly why we...'. One sentence that converts the story into meaning the listener keeps.",
      },
    ],
    drills: [
      "Tell the story of a small everyday failure (burnt dinner, missed bus) with a full arc: want, obstacle, turn, lesson — in 60 seconds.",
      "Write down your last presentation's opening line. Now craft three alternative hooks: a moment, a question, a surprising claim. Say each aloud.",
      "Take a boring fact you know and wrap a person around it: who discovered it, who it saved, who it ruined.",
    ],
    questions: [
      "Tell me about a time something went wrong and what you did about it. Hook me in the first sentence.",
      "Share the story behind something you own that matters to you — make it a scene, not a description.",
      "Convince me of a lesson you learned the hard way, using the story of how you learned it.",
    ],
    evaluationFocus:
      "Judge the hook (does the first sentence earn attention?), story arc (person, want, obstacle, change), specificity (concrete details vs abstractions), and the so-what landing. Vocal energy supports but content engagement is the core.",
  },
  {
    slug: "speak-with-hail",
    title: "Speak with HAIL",
    category: "Connection",
    trains: "Connection",
    tagline: "Honesty, Authenticity, Integrity, Love — the foundation everything stands on.",
    sections: [
      {
        heading: "Why technique isn't enough",
        body: "Julian Treasure's insight: people don't just hear your words, they hear your stance toward them. HAIL — Honesty, Authenticity, Integrity, Love — is that stance. A technically perfect speaker who fails HAIL sounds like an ad. A HAIL speaker with rough technique still connects.",
      },
      {
        heading: "Honesty and its edge",
        body: "Be clear and straight — say the thing. But honesty without love is brutality; 'I'm just being honest' usually announces a wound in progress. Straight talk aimed at helping, not scoring.",
      },
      {
        heading: "Authenticity over performance",
        body: "Speaking in your own voice — your words, your cadence — beats imitating a TED speaker. Listeners detect performance instantly. The paradox: dropping the polish is what sounds polished.",
      },
      {
        heading: "Love, practically",
        body: "Not romance — goodwill. Wishing your listener well changes your word choice, your patience, your tone, all without acting. Before speaking, one silent question: 'what do THEY need from this?' It audibly reshapes everything.",
      },
    ],
    drills: [
      "Record 30 seconds of advice to someone five years younger than you — first as 'an expert would say it', then exactly as YOU would say it to a friend. Keep the second voice.",
      "Deliver one piece of genuinely critical feedback about something, phrased to help the person improve rather than to be right.",
      "Speak for 45 seconds about something you love, to someone you like. Notice what your voice does — that's your HAIL baseline.",
    ],
    questions: [
      "Give honest, caring advice to someone about to make a mistake you once made.",
      "Talk about a belief you've changed your mind on — honestly, including what you got wrong.",
      "Appreciate someone in your life out loud, as if they were listening — specific, sincere, unhedged.",
    ],
    evaluationFocus:
      "Grade against HAIL directly: is the speech clear and straight (honesty), in the speaker's own natural voice (authenticity — warmth in delivery metrics helps), consistent and owned (integrity — no weasel words), and oriented toward the listener's good (love)? Detect and penalize performance-voice, hedging, and self-focus.",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** Fuzzy-match a free-text focus (from analysis recommendedLessons) to a lesson. */
export function findLessonByFocus(focus: string): Lesson | undefined {
  const f = focus.toLowerCase();
  const keywords: [string[], string][] = [
    [["prosody", "melody", "monotone", "variety", "pitch"], "melodic-range"],
    [["pause", "silence"], "power-of-pause"],
    [["pace", "speed", "tempo", "wpm"], "pace-control"],
    [["volume", "projection", "loud", "quiet"], "projection-presence"],
    [["filler", "concise", "um", "hedge"], "kill-the-fillers"],
    [["structure", "clarity", "organiz", "prep"], "structure-first"],
    [["story", "engage", "hook"], "storytelling-hooks"],
    [["hail", "connect", "authent", "honest", "love"], "speak-with-hail"],
  ];
  for (const [words, slug] of keywords) {
    if (words.some((w) => f.includes(w))) return getLesson(slug);
  }
  return undefined;
}
