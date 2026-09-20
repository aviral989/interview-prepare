/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { Type } from "@google/genai";
import { getGemini } from "./gemini";

const router = express.Router();

// Middleware to parse JSON payloads
router.use(express.json());

// ----------------------------------------------------
// SCHEMAS DEFINITION using GoogleGenAI Type Enum
// ----------------------------------------------------

const CandidateProfileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Full name of the candidate. If not found, output 'Unknown Candidate'" },
    experience_level: { type: Type.STRING, description: "Determined level: junior, mid, senior, lead, staff" },
    target_role: { type: Type.STRING, description: "Inferred or explicit target job/role (e.g. Full Stack Engineer, Backend Engineer, Staff Dev)" },
    primary_stack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core languages, frameworks, or system competencies" },
    secondary_stack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lesser used or supporting tools and languages" },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING, description: "Clear 1-2 sentence technical summary including achievements and engineering challenges" }
        },
        required: ["title", "description"]
      }
    },
    achievements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key quantitative achievements or promotions" },
    domain_experience: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific industries or technology domains (e.g., Cloud Platforms, Fintech, E-commerce)" },
    seniority_estimate: { type: Type.STRING, description: "Technical summary explanation of the seniority level and why" },
    possible_weak_areas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific gaps in the experience, missing metrics, or shallow stack listings" },
    likely_interview_focus_areas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific topics or areas the candidate must prepare for FAANG (such as distributed caching, concurrency, STAR metric tracking)" }
  },
  required: [
    "name", "experience_level", "target_role", "primary_stack", "secondary_stack",
    "projects", "achievements", "domain_experience", "seniority_estimate",
    "possible_weak_areas", "likely_interview_focus_areas"
  ]
};

const QuestionSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Must be 'question'" },
    mode: { type: Type.STRING, description: "machine_coding, dsa, or system_design" },
    round: { type: Type.STRING, description: "Identifier of the current round or question name" },
    question: { type: Type.STRING, description: "The single specific question text. DO NOT ask multiple sub-questions at once." },
    difficulty: { type: Type.STRING, description: "easy, medium, or hard" },
    goal: { type: Type.STRING, description: "The primary behavioral/technical target of this question." },
    expected_answer_outline: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key technical points, milestones, or framework phases the interviewer expects" },
    follow_up_triggers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific weak signals that should prompt the interviewer to ask follow-up questions" },
    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Topic tags (e.g. Cache, STAR-Ambiguity, Sorting, Ownership)" }
  },
  required: ["type", "mode", "round", "question", "difficulty", "goal", "expected_answer_outline", "follow_up_triggers", "tags"]
};

const EvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Must be 'evaluation'" },
    mode: { type: Type.STRING },
    question: { type: Type.STRING },
    candidate_answer_summary: { type: Type.STRING, description: "A highly concise technical summary of what the candidate answered" },
    score: { type: Type.INTEGER, description: "Strict integer score between 1 and 10 based on FAANG bar standards (7 is borderline, 8 solid hire, 9 strong hire, 10 outstanding, <7 lean no hire)" },
    rubric: {
      type: Type.OBJECT,
      properties: {
        correctness: { type: Type.INTEGER, description: "Score out of 10 for technical accuracy or correctness of details" },
        depth: { type: Type.INTEGER, description: "Score out of 10 for deep knowledge and engineering maturity" },
        clarity: { type: Type.INTEGER, description: "Score out of 10 for explanation clarity and structure" },
        structure: { type: Type.INTEGER, description: "Score out of 10 for STAR structuring or algorithmic logic" },
        communication: { type: Type.INTEGER, description: "Score out of 10 for verbal/written articulacy and directness" },
        trade_off_reasoning: { type: Type.INTEGER, description: "Score out of 10 for presenting balanced pros and cons" },
        edge_cases: { type: Type.INTEGER, description: "Score out of 10 for identifying edge failure modes, scale constraints, or scale complexities" }
      },
      required: ["correctness", "depth", "clarity", "structure", "communication", "trade_off_reasoning", "edge_cases"]
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific positive aspects of the user's answer (at least 2 points)" },
    mistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific flaws, wrong assertions, or suboptimal strategies in the answer (at least 1 point if score < 10)" },
    missing_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Crucial details, edge cases, caching arguments, complexity estimations, or STAR metrics that were left out" },
    ideal_answer_outline: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bullet points detailing of what a world-class candidate answer must include" },
    follow_up_question: { type: Type.STRING, description: "If next_action is 'probe', this field is the follow-up question. Otherwise, leave empty." },
    hint: { type: Type.STRING, description: "Brief constructive hint for the candidate if they seem stuck, else leave empty." },
    next_action: { type: Type.STRING, description: "Must be 'probe' (need clarification on this question), 'move_next' (go to next question of interview), or 'end_round' (all questions answered, compile report)" }
  },
  required: ["type", "mode", "question", "candidate_answer_summary", "score", "rubric", "strengths", "mistakes", "missing_points", "ideal_answer_outline", "follow_up_question", "hint", "next_action"]
};

const ReportSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Must be 'report'" },
    overall_score: { type: Type.INTEGER, description: "Aggregate final interview rating scale out of 10" },
    round_scores: {
      type: Type.OBJECT,
      properties: {
        machine_coding: { type: Type.INTEGER },
        dsa: { type: Type.INTEGER },
        system_design: { type: Type.INTEGER }
      },
      required: ["machine_coding", "dsa", "system_design"]
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Global strengths identified throughout this interview" },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Core underlying vulnerabilities demonstrated under pressure" },
    weak_areas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: "Specific skill/topic (e.g., STAR Conflict Metrics, Complexity analysis, Sharding details)" },
          evidence: { type: Type.STRING, description: "Direct evidence shown during this session" },
          priority: { type: Type.STRING, description: "high, medium, or low" }
        },
        required: ["area", "evidence", "priority"]
      }
    },
    hiring_readiness: { type: Type.STRING, description: "Clear, blunt FAANG recruiter briefing summarizing hire status: Strongly Hire, Hire, Borderline, No Hire, with a 2-sentence rationale." },
    improvement_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: "Day count (1 to 7)" },
          focus: { type: Type.STRING, description: "Topic of focus for this day" },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Targeted actionable drills and readings (at least 2 specific tasks)" }
        },
        required: ["day", "focus", "tasks"]
      }
    },
    next_session_recommendation: { type: Type.STRING, description: "The specific next focus area or mode recommended for the user's next session." }
  },
  required: ["type", "overall_score", "round_scores", "strengths", "weaknesses", "weak_areas", "hiring_readiness", "improvement_plan", "next_session_recommendation"]
};

// ----------------------------------------------------
// ROUTE IMPLEMENTATIONS
// ----------------------------------------------------

/**
 * Endpoint to analyze resume / pasted profile text
 */
router.post('/profile/extract', async (req, res) => {
  try {
    const { experienceText } = req.body;
    if (!experienceText || typeof experienceText !== 'string' || experienceText.trim() === '') {
      res.status(400).json({ error: "Missing experience/resume text." });
      return;
    }

    const ai = getGemini();
    const prompt = `
Analyze the following developer resume or pasted professional experience profile text.
Extract core structured profile metrics. Be realistic, sharp, and look for missing high-grade FAANG attributes or gaps in metrics.
If there are missing metrics, note them as gap areas in 'possible_weak_areas' or 'likely_interview_focus_areas'.
Be extremely honest and analytical.

Resume/Profile experience Text:
"""
${experienceText}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CandidateProfileSchema,
        systemInstruction: "You are an elite Lead FAANG Recruiter and Principal Engineer specializing in hiring software engineers. Analyze resumes with extreme precision, estimating accurate seniority levels (Junior, Mid, Senior, Lead, Staff), evaluating tech stack depth, detecting gaps in metrics/impact, and planning real challenging interviews."
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error extracting profile:", err);
    res.status(500).json({ error: err.message || "Failed to process profile." });
  }
});

/**
 * Endpoint to generate the next interview question
 */
router.post('/interview/generate-question', async (req, res) => {
  try {
    const { mode, difficulty, focusArea, profile, history } = req.body;

    if (!mode || !difficulty || !focusArea) {
      res.status(400).json({ error: "Missing required properties (mode, difficulty, focusArea)." });
      return;
    }

    const ai = getGemini();

    const historyPrompt = history && history.length > 0 
      ? `Previous Q&As in this session:\n${JSON.stringify(history, null, 2)}`
      : "No previous questions asked in this session. This is the first question.";

    const profileText = profile 
      ? `Candidate Resume Profile: ${JSON.stringify(profile)}`
      : "No parsed resume profile available. Assume a general Software Engineer candidate.";

    const prompt = `
You are a tough FAANG interviewer conducting a live round.
Interview Mode: ${mode}
Target Difficulty: ${difficulty}
Focus Area: ${focusArea}

${profileText}

${historyPrompt}

Generate the NEXT interview question.
IMPORTANT RULES:
- Ask only ONE main fundamental question at a time. Do not compile multiple unrelated sub-questions.
- Keep the wording strict, professional, and matching real FAANG interviews (e.g. Google, Meta, Apple, Netflix).
- Tailor the question complexity to the target difficulty (${difficulty}) and the candidate's estimated seniority level.
- If they succeeded on previous questions (seen in history scores), subtly raise the difficulty or explore deeper architectural trade-offs.
- If they struggled on previous questions, check their core understanding but do NOT lower the standards below FAANG levels.
- For machine_coding rounds: Ask the candidate to design a highly challenging low-level design (LLD) system, class architecture, or API interface (e.g. Design an In-Memory Key-Value Store with transaction support/rollback, Design a parking lot, or Design a Splitwise ledger). Emphasize SOLID principles, clean classes, and concurrent-safe patterns.
- For DSA rounds: Give an interesting problem (conceptual, logic-heavy or algorithmic) requiring thinking. The question MUST contain pre-formatted subparts: Description/Details, Input Statement, structured Examples (Input, Output, Explanation in a clear, easy-to-read layout), and Constraints.
- For System Design: Give an immersive system design prompt (e.g., "Design a globally distributed rate limiter", "Design high-throughput chat telemetry"). Focus on scaling, trade-offs, storage choices, caching, metrics, and failure recovery.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: QuestionSchema,
        systemInstruction: "You are a senior technical interviewer at a tier-1 FAANG company. You are strict, structured, direct, and completely free of fluff. You do not baby candidates, and you write highly realistic questions targeted at probing real technical depth and concrete metrics."
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error generating question:", err);
    res.status(500).json({ error: err.message || "Failed to generate next question." });
  }
});

/**
 * Endpoint to evaluate candidate answer
 */
router.post('/interview/evaluate', async (req, res) => {
  try {
    const { mode, question, answer, expectedAnswerOutline, history, focusArea } = req.body;

    if (!mode || !question || !answer) {
      res.status(400).json({ error: "Missing required parameters (mode, question, answer)." });
      return;
    }

    const ai = getGemini();

    const historyPrompt = history && history.length > 0
      ? `Previous conversations for context:\n${JSON.stringify(history, null, 2)}`
      : "This is the first evaluation in the session.";

    const outlineText = expectedAnswerOutline && expectedAnswerOutline.length > 0
      ? `Interviewer expectations and outline points: ${JSON.stringify(expectedAnswerOutline)}`
      : "";

    const prompt = `
Perform a highly critical FAANG-level evaluation of the candidate's response.
Interview Mode: ${mode}
Focus Area: ${focusArea || 'General'}

Question asked:
"${question}"

Candidate's Answer:
"${answer}"

${outlineText}

${historyPrompt}

Evaluation Guidelines:
- Scoring is STRICT. There is absolutely NO fake praise.
- Be critical. Detect if the answer is abstract, missing concrete performance metrics, lacking design patterns or concurrency handling (in machine_coding), lacking algorithmic optimizations (in DSA), or missing fault-tolerance, database partitions, in-memory caching mechanisms, or bottleneck analyses (in System Design).
- Give an honest score out of 10. A score of 7 is borderline hiring, 8 is a solid hire, 9 is staff-ready, and 5-6 represents minor gaps, while <=4 represents major failures or fatal errors.
- Based on their answer, pick the appropriate 'next_action':
  - Select 'probe' if their answer was slightly vague or skipped metrics/complexities, and you want to ask a specific follow-up ('follow_up_question') to drill down on that.
  - Select 'move_next' if they provided a comprehensive, solid answer and we are ready to move to another question.
  - Select 'end_round' if the allotted interview depth is attained or there are multiple questions behind us.
- Provide direct, constructive 'strengths', 'mistakes', 'missing_points', and the 'ideal_answer_outline'.
- Keep your follow-up questions realistic (e.g. "What happened when the write stream got backlogged?", "What is the amortized complexity of that lookup?", "How did you measure the 30% reduction in latency? What were the baseline logs?").
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: EvaluationSchema,
        systemInstruction: "You are a top-tier FAANG Principal Engineer conducting a rigorous technical evaluation. You evaluate technical arguments, proof-of-work, complexity, trade-offs, and behavioral ownership. Under performance, you are direct, constructively strict, and never sugarcoat mistakes."
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error evaluating answer:", err);
    res.status(500).json({ error: err.message || "Failed to evaluate response." });
  }
});

/**
 * Endpoint to compile the final session scorecard and roadmap
 */
router.post('/interview/report', async (req, res) => {
  try {
    const { mode, difficulty, history, profile } = req.body;

    if (!mode || !history || !history.length) {
      res.status(400).json({ error: "Missing session history for final compilation." });
      return;
    }

    const ai = getGemini();

    const profilePrompt = profile ? `Candidate Bio: ${JSON.stringify(profile)}` : "";

    const prompt = `
The interview session is complete. Compile a massive, rigorous FAANG-level report and a 7-day personalized coaching plan.
Interview Mode: ${mode}
Initial difficulty set: ${difficulty}

${profilePrompt}

Full Q&A Session History:
${JSON.stringify(history, null, 2)}

Provide strict aggregate scoring (scale of 1-10) for this round, strengths list, core weakness categories, specific high/medium priority weak areas supported by text evidence from their answers, a definitive hiring-readiness verdict ("Strongly Hire", "Hire", "Borderline Hire", "No Hire" with a professional recruiter explanation), and a detailed 7-day technical improvement dashboard plan starting from Day 1 to Day 7.

Ensure that the day-to-day timeline targets the specific missing themes or mistakes detected in the historical transcripts! No generic lists.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ReportSchema,
        systemInstruction: "You are a Staff Recruiter Director and Senior Member of the Hiring Committee at Apple/Meta/Google. You compile completely objective, highly technical, and career-shaping summary reports that separate true talent from average coders."
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: err.message || "Failed to compile report." });
  }
});

/**
 * Endpoint to generate micro drills based on weak areas
 */
router.post('/interview/generate-drills', async (req, res) => {
  try {
    const { weak_areas, mode } = req.body;
    const ai = getGemini();

    const prompt = `
Generate 3 challenging and highly dynamic micro-interview drills for a FAANG looping candidate under mode: "${mode || 'General'}".
The drills must be specifically focused on resolving these weak areas / bottlenecks:
${JSON.stringify(weak_areas || ["Designing globally distributed low-latency write paths", "STAR behavioral conflict resolution"])}

For each drill, write:
- title: Brief descriptive title
- topic: The specific technical or STAR focus (e.g. 'Consistent Hashing Sync', 'STAR Conflict Indicators')
- description: A tough micro scenario challenge prompt the user needs to write a short response for.
- difficulty: 'easy', 'medium', or 'hard'
- coaching_points: 3 critical criteria details expected in a high-grade response
`;

    const DrillSchema = {
      type: Type.OBJECT,
      properties: {
        drills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              coaching_points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "topic", "description", "difficulty", "coaching_points"]
          }
        }
      },
      required: ["drills"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: DrillSchema,
        systemInstruction: "You are a senior technical loops instructor at a FAANG preparation academy. You create tough, concise micro-scenarios targeting typical architectural, complex algorithmic, and leadership pitfalls."
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error generating drills:", err);
    res.status(500).json({ error: err.message || "Failed to generate drills." });
  }
});

export default router;
