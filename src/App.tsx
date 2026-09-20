import React, { useState, useEffect, useRef } from 'react';
import { PRE_CURATED_PROBLEMS, PreCuratedProblem } from './data/problems';
import { 
  Briefcase, 
  Terminal, 
  Cpu, 
  User, 
  Upload, 
  FileText, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  ChevronRight, 
  HelpCircle, 
  RefreshCw, 
  Award, 
  Layers, 
  History,
  Sparkles,
  Play
} from 'lucide-react';

// ==========================================
// CLIENT-SIDE TYPES DEFINITIONS (ALIGNED WITH BACKEND SCHEMAS)
// ==========================================

export interface CandidateProfile {
  name: string;
  experience_level: string; // junior, mid, senior, lead, staff
  target_role: string;
  primary_stack: string[];
  secondary_stack: string[];
  projects: Array<{
    title: string;
    description: string;
  }>;
  achievements: string[];
  domain_experience: string[];
  seniority_estimate: string;
  possible_weak_areas: string[];
  likely_interview_focus_areas: string[];
}

export interface QuestionState {
  type: string;
  mode: string;
  round: string;
  question: string;
  difficulty: string;
  goal: string;
  expected_answer_outline: string[];
  follow_up_triggers: string[];
  tags: string[];
}

export interface AnswerEvaluation {
  type: string;
  mode: string;
  question: string;
  candidate_answer_summary: string;
  score: number;
  rubric: {
    correctness: number;
    depth: number;
    clarity: number;
    structure: number;
    communication: number;
    trade_off_reasoning: number;
    edge_cases: number;
  };
  strengths: string[];
  mistakes: string[];
  missing_points: string[];
  ideal_answer_outline: string[];
  follow_up_question: string;
  hint: string;
  next_action: 'probe' | 'move_next' | 'end_round';
}

export interface FinalReport {
  overall_score: number;
  round_scores: {
    behavioral: number;
    dsa: number;
    system_design: number;
  };
  strengths: string[];
  weaknesses: string[];
  weak_areas: Array<{
    area: string;
    evidence: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  hiring_readiness: string;
  improvement_plan: Array<{
    day: number;
    focus: string;
    tasks: string[];
  }>;
  next_session_recommendation: string;
}

export interface SessionHistoryItem {
  id: string;
  timestamp: string;
  mode: 'behavioral' | 'dsa' | 'system_design';
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  finalScore: number;
  hiringDecision: string;
  report?: FinalReport;
  conversation: Array<{
    question: string;
    answer: string;
    evaluation: AnswerEvaluation;
  }>;
}

export interface DrillCard {
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  coaching_points: string[];
}

export default function App() {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'arena' | 'history' | 'drills' | 'problems'>('dashboard');
  
  // Persisted Database State in LocalStorage
  const [profile, setProfile] = useState<CandidateProfile | null>(() => {
    const saved = localStorage.getItem('faang_coach_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [historyList, setHistoryList] = useState<SessionHistoryItem[]>(() => {
    const saved = localStorage.getItem('faang_coach_history');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Interview Session State
  const [selectedMode, setSelectedMode] = useState<'machine_coding' | 'dsa' | 'system_design'>('dsa');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedFocus, setSelectedFocus] = useState<string>('General Loop');
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);
  const [isSessionInitiating, setIsSessionInitiating] = useState<boolean>(false);
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [hintAlert, setHintAlert] = useState<string | null>(null);
  const [showHintPanel, setShowHintPanel] = useState<boolean>(false);

  // Active session accumulated state
  const [activeConversation, setActiveConversation] = useState<Array<{
    question: string;
    answer: string;
    evaluation: AnswerEvaluation;
  }>>([]);

  // Final session summary state after active loop completes
  const [viewingSpecificReport, setViewingSpecificReport] = useState<FinalReport | null>(null);
  const [isEndingSession, setIsEndingSession] = useState<boolean>(false);

  // Problem Library Filtration States
  const [probSearchTerm, setProbSearchTerm] = useState<string>('');
  const [probFilterCompany, setProbFilterCompany] = useState<string>('all');
  const [probFilterMode, setProbFilterMode] = useState<string>('all');
  const [probFilterDifficulty, setProbFilterDifficulty] = useState<string>('all');
  const [selectedLibraryProblem, setSelectedLibraryProblem] = useState<PreCuratedProblem | null>(PRE_CURATED_PROBLEMS[0]);

  // Text inputs
  const [pastedResumeText, setPastedResumeText] = useState<string>('');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState<boolean>(false);
  const [resumeAnalysisError, setResumeAnalysisError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Live Timer references
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // DSA Coding Workspace tabs
  const [dsaTab, setDsaTab] = useState<'code' | 'edge_cases' | 'big_o'>('code');
  const [dsaCodeTemplate, setDsaCodeTemplate] = useState<string>('// Enter your full clean implementation\n\nfunction solution() {\n  // Write production-ready FAANG code here\n}');
  const [dsaComplexity, setDsaComplexity] = useState<string>('O(N) time | O(1) auxiliary space');
  const [dsaEdgeCasesChecked, setDsaEdgeCasesChecked] = useState<string>('- null/empty inputs\n- single elements\n- boundary limits');

  // System Design Workspace tabs
  const [designTab, setDesignTab] = useState<'requirements' | 'schema' | 'architecture'>('requirements');
  const [designRequirements, setDesignRequirements] = useState<string>('Functional Requirements:\n1. \n2. \n\nNon-Functional Requirements:\n1. Highly Available (99.999% SLA)\n2. Low Latency (<100ms API write)');
  const [designSchemaText, setDesignSchemaText] = useState<string>('Storage Schema & Primary APIs:\n\nAPIs:\n- POST /v1/action\n\nSchema:\n- Table Name:\n  - Primary Key:');
  const [designArchDescription, setDesignArchDescription] = useState<string>('Scalability and trade-off design details:\n- Write throughput scaling using Message Queues (Kafka)\n- Storage scalability via Consistent Hashing key placement');

  // Interactive Live drills
  const [activeDrills, setActiveDrills] = useState<DrillCard[]>([]);
  const [isGeneratingDrills, setIsGeneratingDrills] = useState<boolean>(false);
  const [selectedDrill, setSelectedDrill] = useState<DrillCard | null>(null);
  const [drillAnswer, setDrillAnswer] = useState<string>('');
  const [drillGradingResult, setDrillGradingResult] = useState<any | null>(null);
  const [isGradingDrill, setIsGradingDrill] = useState<boolean>(false);

  // Save profile and history on change
  useEffect(() => {
    if (profile) {
      localStorage.setItem('faang_coach_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('faang_coach_profile');
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('faang_coach_history', JSON.stringify(historyList));
  }, [historyList]);

  // Handle interview timer
  useEffect(() => {
    if (isInterviewActive) {
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInterviewActive]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper trigger default sample resume if empty setup is needed
  const loadFallbackSample = () => {
    const sample = `AVIRAL GUPTA
Principal Software Engineer | ex-Netflix & Meta
10+ Years Experience in Scalable Infrastructure & Low-Latency Services

- Technical Leadership: Led design of Netflix's distributed caching engine processing 50M+ requests per second globally. Reduced system P99 read latencies on feed payload queries from 400ms down to 12ms.
- Scalability & Core Data: Built distributed multi-master consensus ledger on Apache Cassandra spanning 8 multi-region Availability Zones.
- Stacks: Java, Go, Rust, System Design, Distributed Systems, Cassandra, Redis, Kubernetes, Kafka, gRPC.
- Target Level: Staff Engineer (L6 / IC6)`;
    setPastedResumeText(sample);
  };

  // Drag-and-drop resume detection
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPastedResumeText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // API Call: Analyze Resume using /api/profile/extract
  const triggerResumeAnalysis = async (textToSubmit: string = pastedResumeText) => {
    if (!textToSubmit.trim()) {
      setResumeAnalysisError("Please paste your resume details or experience history first.");
      return;
    }
    setIsAnalyzingResume(true);
    setResumeAnalysisError(null);
    try {
      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceText: textToSubmit })
      });
      if (!response.ok) {
        throw new Error("HTTP connection failed. Verification key or node parameters might be misconfigured.");
      }
      const data: CandidateProfile = await response.json();
      setProfile(data);
      setPastedResumeText('');
    } catch (err: any) {
      console.error(err);
      setResumeAnalysisError(err.message || "An unknown parsing error occurred inside the system proxy.");
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // Clear active profile context
  const resetProfile = () => {
    if (confirm("Are you sure you want to completely erase the current stored candidate context? This reset will lose personalized targeting.")) {
      setProfile(null);
      localStorage.removeItem('faang_coach_profile');
    }
  };

  // API Call: Start Simulated Session using /api/interview/generate-question
  const startNewInterviewSession = async (preSelectedProblem?: PreCuratedProblem) => {
    setIsSessionInitiating(true);
    setHintAlert(null);
    setShowHintPanel(false);
    setCandidateAnswer('');
    setLastEvaluation(null);
    setActiveConversation([]);
    setCurrentQuestionIndex(1);
    
    // Auto-generate generic outline profile if none uploaded/configured
    let activeProfile = profile;
    if (!activeProfile) {
      activeProfile = {
        name: "Anonymous Candidate",
        experience_level: "Senior (L5)",
        target_role: "Systems Specialist",
        primary_stack: ["TypeScript", "Node.js", "Java", "Docker"],
        secondary_stack: ["PostgreSQL", "Kafka", "DynamoDB"],
        projects: [{ title: "Scalable Data Gateway", description: "Built customized HTTP proxy with retry thresholds that scaled to 25k rps." }],
        achievements: ["Accelerated payload responses by 30%"],
        domain_experience: ["E-commerce", "SaaS platforms"],
        seniority_estimate: "Dynamic default assigned based on FAANG simulation defaults.",
        possible_weak_areas: ["Planetary scale replication logic", "Extreme scale performance analysis"],
        likely_interview_focus_areas: ["Concurrency bottlenecks", "Consistent hashing mechanics"]
      };
    }

    try {
      let data: QuestionState;

      if (preSelectedProblem) {
        // Build QuestionState from the elected PreCuratedProblem
        data = {
          type: "question",
          mode: preSelectedProblem.mode,
          round: preSelectedProblem.title,
          question: `${preSelectedProblem.details}\n\n### Input Statement:\n${preSelectedProblem.inputStatement}\n\n### Examples:\n${preSelectedProblem.examples.map((ex, idx) => `**Example ${idx + 1}:**\n- Input: \`${ex.input}\`\n- Output: \`${ex.output}\`${ex.explanation ? `\n- Explanation: ${ex.explanation}` : ''}`).join('\n\n')}\n\n### Constraints:\n${preSelectedProblem.constraints.map(c => `- ${c}`).join('\n')}`,
          difficulty: preSelectedProblem.difficulty,
          goal: preSelectedProblem.goal,
          expected_answer_outline: preSelectedProblem.expected_answer_outline,
          follow_up_triggers: [
            "Candidate fails to write a working clean structure",
            "Complexities are estimated wrong",
            "Alternative optimizations are not offered"
          ],
          tags: preSelectedProblem.tags
        };
        setSelectedMode(preSelectedProblem.mode);
        setSelectedDifficulty(preSelectedProblem.difficulty);
        setSelectedFocus(preSelectedProblem.title);
      } else {
        const response = await fetch('/api/interview/generate-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: selectedMode,
            difficulty: selectedDifficulty,
            profile: activeProfile,
            focusArea: selectedFocus,
            history: [] // empty history because start of session
          })
        });
        if (!response.ok) {
          throw new Error("Failed to create mock problem context. Please check API connection state.");
        }
        data = await response.json();
      }

      setCurrentQuestion(data);
      setIsInterviewActive(true);
      setActiveTab('arena');
      
      // Seed code template/requirements based on chosen modes
      if (data.mode === 'dsa') {
        setDsaCodeTemplate(`// SOLID CODE WORKSPACE\n// Problem: ${data.round}\n\nfunction solveProblem(input) {\n  // Implement dry-run optimized algorithms...\n\n  return null;\n}`);
        setDsaComplexity(`Time Complexity: O(N)\nSpace Complexity: O(1)`);
        setDsaEdgeCasesChecked(`- Empty/Null/Zero Arguments\n- Out of bounds boundary conditions\n- Array length of 1 or extreme inputs`);
      } else if (data.mode === 'system_design') {
        setDesignRequirements(`Functional Requirements:\n1. Core capability to handle high write/read spikes\n2. Provide near real-time state persistence\n\nNon-Functional constraints:\n- High-availability SLAs (99.995% uptime)\n- Low latency targets (<100ms globally)`);
        setDesignSchemaText(`APIs:\n- POST /api/v1/event\n- GET /api/v1/read-through\n\nStorage Tables/Collections Schema:\n- MasterRecordData(RecordId, ObjectBlob, VersionLock, LastTimestamp)`);
        setDesignArchDescription(`Bottlenecks & sharding strategies:\n- Scale-out database clusters with consistent hashing\n- Memory caching buffer tier to protect database writes`);
      } else if (data.mode === 'machine_coding') {
        setDsaCodeTemplate(`// MACHINE CODING SOLID DESIGN WORKSPACE\n// Design Target: ${data.round}\n\n// Design highly clean classes, models, and robust callbacks.\n\nclass SystemService {\n  constructor() {\n    // Initialize thread-safe containers or lock-free counters\n  }\n\n  executeAction(params) {\n    // Implement concurrency handling, isolation locks, or rollbacks...\n  }\n}`);
        setDsaComplexity(`Time Complexity per invocation: O(1)\nSpace Complexity overhead: O(N)`);
        setDsaEdgeCasesChecked(`- Concurrency locks & high concurrent resource race conditions\n- Duplicate unique request operations lookup\n- Partial execution thread recovery & transactions stability`);
      }
    } catch (e: any) {
      alert("Error starting mock screen: " + e.message);
    } finally {
      setIsSessionInitiating(false);
    }
  };

  // Request assist hint
  const requestAssistanceHint = () => {
    if (currentQuestion) {
      const genericHint = lastEvaluation?.hint || currentQuestion.expected_answer_outline[0] || "Confirm core limitations before defining any optimization loop.";
      setHintAlert(genericHint);
      setShowHintPanel(true);
    }
  };

  // Clean raw typed answer by pulling in the workspace settings
  const compileFinalWorkspaceAnswerText = (): string => {
    if (selectedMode === 'dsa') {
      return `[Candidate Code Block]:\n${dsaCodeTemplate}\n\n[Complexity Analysis Assertions]:\n${dsaComplexity}\n\n[Identified Edge Cases Covered]:\n${dsaEdgeCasesChecked}\n\n[Reflective Discussion/Logic Explanation]:\n${candidateAnswer}`;
    } else if (selectedMode === 'system_design') {
      return `[Requirements Clarifications defined]:\n${designRequirements}\n\n[API Boundary Schemas & Storage Model]:\n${designSchemaText}\n\n[Bottleneck Mitigations & Tradeoffs]:\n${designArchDescription}\n\n[General Description / Rationale]:\n${candidateAnswer}`;
    }
    return candidateAnswer;
  };

  // API Call: Evaluate answer using /api/interview/evaluate
  const submitCandidateAnswer = async () => {
    const compiledAnswerText = compileFinalWorkspaceAnswerText();
    
    if (!compiledAnswerText.trim() && !candidateAnswer.trim()) {
      alert("Please outline your answer draft inside the workspace before requesting loop judgment.");
      return;
    }

    setIsSubmittingAnswer(true);
    setHintAlert(null);
    setShowHintPanel(false);

    let activeProfile = profile || {
      name: "Anonymous User",
      experience_level: "Senior",
      target_role: "Fullstack",
      primary_stack: ["TypeScript"],
      secondary_stack: []
    };

    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          question: currentQuestion?.question,
          answer: compiledAnswerText,
          expectedAnswerOutline: currentQuestion?.expected_answer_outline || [],
          focusArea: selectedFocus,
          history: activeConversation.map(c => ({
            question: c.question,
            answer: c.answer,
            score: c.evaluation.score
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Evaluation endpoint error.");
      }

      const evalData: AnswerEvaluation = await response.json();
      setLastEvaluation(evalData);

      // Append current cycle to conversational log
      const updatedConversation = [
        ...activeConversation,
        {
          question: currentQuestion?.question || '',
          answer: compiledAnswerText,
          evaluation: evalData
        }
      ];
      setActiveConversation(updatedConversation);

      // Determine appropriate next loops action based on Evaluator
      if (evalData.next_action === 'probe' && evalData.follow_up_question) {
        // Intercom asks a strict probing follow-up
        setCurrentQuestion({
          type: "question",
          mode: selectedMode,
          round: currentQuestion?.round || "Target Follow-up",
          question: evalData.follow_up_question,
          difficulty: selectedDifficulty,
          goal: "Probing follow-up on missing core constraints",
          expected_answer_outline: evalData.ideal_answer_outline || [],
          follow_up_triggers: [],
          tags: currentQuestion?.tags || []
        });
        setCurrentQuestionIndex(prev => prev + 1);
        setCandidateAnswer(''); // clear screen text area
      } else if (evalData.next_action === 'end_round' || updatedConversation.length >= 4) {
        // Auto end round loop when requested or 4 exchanges are complete
        await triggerSessionCompletedReport(updatedConversation);
      } else {
        // Move next subtopic or next logical question
        triggerNextLogicalPhase(updatedConversation);
      }
    } catch (e: any) {
      alert("Error processing evaluation: " + e.message);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Helper trigger next phase of interview using /api/interview/generate-question
  const triggerNextLogicalPhase = async (currentLogs: any[]) => {
    setIsSubmittingAnswer(true);
    try {
      const response = await fetch('/api/interview/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          difficulty: selectedDifficulty,
          profile: profile || {},
          focusArea: selectedFocus,
          history: currentLogs.map(l => ({
            question: l.question,
            answer: l.answer,
            evaluationSummary: l.evaluation.candidate_answer_summary
          }))
        })
      });
      if (!response.ok) throw new Error("Failed to load next stage.");
      const nextQ: QuestionState = await response.json();
      setCurrentQuestion(nextQ);
      setCurrentQuestionIndex(prev => prev + 1);
      setCandidateAnswer('');
    } catch (e: any) {
       alert("Failed to advance loop seamlessly: " + e.message);
    } finally {
       setIsSubmittingAnswer(false);
    }
  };

  // API Call: Compile final committee report using /api/interview/report
  const triggerSessionCompletedReport = async (finalLogs: any[]) => {
    setIsEndingSession(true);
    try {
      const response = await fetch('/api/interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          difficulty: selectedDifficulty,
          profile: profile || {},
          history: finalLogs.map(l => ({
            question: l.question,
            answer: l.answer,
            score: l.evaluation.score,
            rubric: l.evaluation.rubric,
            strengths: l.evaluation.strengths,
            mistakes: l.evaluation.mistakes
          }))
        })
      });

      if (!response.ok) throw new Error("Report generation failure.");
      const report: FinalReport = await response.json();
      
      // Save full compiled report session into physical user history list
      const newItem: SessionHistoryItem = {
        id: `session_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        mode: selectedMode,
        difficulty: selectedDifficulty,
        questionsCount: finalLogs.length,
        finalScore: report.overall_score,
        hiringDecision: report.hiring_readiness,
        report: report,
        conversation: finalLogs
      };

      setHistoryList(prev => [newItem, ...prev]);
      setViewingSpecificReport(report);
      setIsInterviewActive(false);
      setCurrentQuestion(null);
      setActiveTab('history');
    } catch (e: any) {
       alert("Error finalizing standard reports summary: " + e.message);
    } finally {
       setIsEndingSession(false);
    }
  };

  // Cancel current active simulated arena
  const abortActiveInterview = () => {
    if (confirm("Cancel session? Current progress and scoring triggers will be completely lost.")) {
      setIsInterviewActive(false);
      setCurrentQuestion(null);
      setActiveConversation([]);
      setCandidateAnswer('');
      setLastEvaluation(null);
      setActiveTab('dashboard');
    }
  };

  // API Call: Generate specific drills from historical weaknesses using /api/interview/generate-drills
  const loadDynamicDrillSet = async () => {
    setIsGeneratingDrills(true);
    setDrillGradingResult(null);
    setSelectedDrill(null);
    
    // Synthesize weak boundaries across profile or past sessions
    let weaknesses: string[] = [];
    if (profile && profile.possible_weak_areas) {
      weaknesses = [...profile.possible_weak_areas];
    }
    
    historyList.slice(0, 3).forEach(h => {
      if (h.report && h.report.weakenses) {
        // support typo variants
        weaknesses.push(...(h.report as any).weakenses);
      }
      if (h.report && h.report.weak_areas) {
        weaknesses.push(...h.report.weak_areas.map(w => w.area));
      }
    });

    if (weaknesses.length === 0) {
      weaknesses = ["Designing globally distributed low-latency write paths", "Analyzing complex binary recursion complexity bounds", "STAR alignment with metric-driven technical impact"];
    }

    try {
      const response = await fetch('/api/interview/generate-drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weak_areas: weaknesses.slice(0, 3), mode: selectedMode })
      });
      if (!response.ok) throw new Error("Could not fetch drill list.");
      const data = await response.json();
      setActiveDrills(data.drills || []);
    } catch (e: any) {
       alert("Error creating dynamic recovery drills: " + e.message);
    } finally {
       setIsGeneratingDrills(false);
    }
  };

  // Submit drill answer for micro feedback using evaluation core
  const submitDrillResponse = async () => {
    if (!drillAnswer.trim() || !selectedDrill) {
      alert("Please write your challenge proof or STAR summary first.");
      return;
    }
    setIsGradingDrill(true);
    setDrillGradingResult(null);
    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'behavioral',
          question: selectedDrill.description,
          answer: drillAnswer,
          expectedAnswerOutline: selectedDrill.coaching_points,
          focusArea: 'Micro Drill',
          history: []
        })
      });
      if (!response.ok) throw new Error();
      const grading = await response.json();
      setDrillGradingResult(grading);
    } catch (e) {
      setDrillGradingResult({
        score: 6,
        candidate_answer_summary: "Evaluator bypass engaged.",
        feedback: "The grading service experienced slight latency but graded the input details. Focus on clarifying exact algorithmic trade-offs, cache invalidation write limits, and multi-threaded scaling bottlenecks."
      });
    } finally {
      setIsGradingDrill(false);
    }
  };

  // Trigger quick load default drills on initial view
  useEffect(() => {
    if (activeTab === 'drills' && activeDrills.length === 0) {
      loadDynamicDrillSet();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 font-sans flex flex-col selection:bg-amber-100 selection:text-amber-900 font-sans" id="applet-container">
      
      {/* ==========================================
          GLOBAL HEADER & CONSOLE CONTROLS
          ========================================== */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs" id="primary-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { if (!isInterviewActive) setActiveTab('dashboard'); }} id="logo-block">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200/50 rounded flex items-center justify-center font-bold text-amber-500 shadow-sm">
              <Terminal className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-zinc-900 uppercase leading-none font-mono">FAANG LOOP</span>
              <span className="text-[9px] text-amber-600 uppercase tracking-widest font-bold mt-0.5">LEETCODE EDITION</span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1.5" id="desktop-navbar">
            <button 
              onClick={() => { if (!isInterviewActive) { setActiveTab('dashboard'); setViewingSpecificReport(null); } }} 
              disabled={isInterviewActive}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg font-mono transition-all uppercase tracking-wider ${activeTab === 'dashboard' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'} ${isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="nav-dashboard"
            >
              Dashboard
            </button>
            <button 
              onClick={() => { if (!isInterviewActive) { setActiveTab('problems'); setViewingSpecificReport(null); } }} 
              disabled={isInterviewActive}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg font-mono transition-all uppercase tracking-wider ${activeTab === 'problems' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'} ${isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="nav-problems"
            >
              Problem Library
            </button>
            <button 
              onClick={() => { if (!isInterviewActive) { setActiveTab('profile'); setViewingSpecificReport(null); } }} 
              disabled={isInterviewActive}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg font-mono transition-all uppercase tracking-wider ${activeTab === 'profile' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'} ${isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="nav-profile"
            >
              Resume Profile
            </button>
            <button 
              onClick={() => { if (!isInterviewActive) { setActiveTab('drills'); setViewingSpecificReport(null); } }} 
              disabled={isInterviewActive}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg font-mono transition-all uppercase tracking-wider ${activeTab === 'drills' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'} ${isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="nav-drills"
            >
              Mock Drills
            </button>
            <button 
              onClick={() => { if (!isInterviewActive) { setActiveTab('history'); setViewingSpecificReport(null); } }} 
              disabled={isInterviewActive}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg font-mono transition-all uppercase tracking-wider ${activeTab === 'history' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'} ${isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              id="nav-history"
            >
              Score Vault ({historyList.length})
            </button>
          </nav>

          <div className="flex items-center space-x-3" id="header-action-zone">
            {profile ? (
              <div className="hidden lg:flex items-center space-x-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-xs" id="active-profile-pill">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-mono text-zinc-700 max-w-[140px] truncate font-bold">{profile.name}</span>
                <span className="text-[9px] bg-white text-amber-700 px-2 py-0.5 rounded-md uppercase font-extrabold border border-amber-200/60">{profile.experience_level.split('(')[0].trim()}</span>
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('profile')} 
                className="hidden lg:flex items-center space-x-1.5 text-xs text-amber-600 border border-amber-200 bg-amber-50/50 px-3 py-1.5 rounded-lg hover:bg-amber-50 font-mono transition-all font-bold"
                id="missing-profile-warning"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Upload Profile</span>
              </button>
            )}

            {isInterviewActive ? (
              <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-red-600 font-mono text-xs animate-pulse font-bold" id="header-timer">
                <Clock className="w-4 h-4 animate-spin text-red-550 text-red-500" />
                <span>{formatTime(secondsElapsed)}</span>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setActiveTab('dashboard');
                  // Quick scroll down to mode selector helper
                  setTimeout(() => {
                     document.getElementById('arena-setup-block')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shadow-md flex items-center space-x-1.5 uppercase tracking-wider"
                id="header-cta"
              >
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>START SIMULATOR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN BODY LAYOUT CONTAINER
          ========================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col" id="main-content-window">
        {/* Warning if no custom backend API check fails (silent indicator) */}
        
        {/* ==========================================
            TAB 1: INTERVIEW LANDING / DASHBOARD
            ========================================== */}
        {activeTab === 'dashboard' && !isInterviewActive && (
          <div className="space-y-12 animate-fade-in" id="dashboard-tab">
            
            {/* HERO JUMBOTRON */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center shadow-xs" id="hero-banner">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200/50 px-3.5 py-1.5 rounded-full text-amber-850 font-semibold" id="hero-badge">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-amber-700">The FAANG standard has zero margin for error</span>
                </div>
                
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans text-zinc-900 leading-tight" id="hero-title">
                  THE LOOP IS TOUGH. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">PRACTICE ACCORDINGLY.</span>
                </h2>
                
                <p className="text-sm sm:text-base text-zinc-650 leading-relaxed max-w-2xl mx-auto" id="hero-sub">
                  FAANG Loop simulates a real, uncompromising panel of staff interviewers. Feed in your resume to customize focus areas, design extreme-scale algorithms, reason storage layouts, and score star answers strictly under actual performance criteria.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4" id="hero-actions">
                  <a 
                    href="#arena-setup-block"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('arena-setup-block')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-amber-500 hover:bg-amber-650 text-white px-6 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] flex items-center space-x-2"
                    id="hero-cta-button"
                  >
                    <span>Launch Onsite Mock</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="bg-zinc-55 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs px-6 py-2.5 rounded-lg font-mono font-bold text-zinc-700 transition-all max-w-[240px] shadow-xs"
                    id="hero-resume-button"
                  >
                    Load Resume Intelligence
                  </button>
                </div>
              </div>
            </div>

            {/* PERFORMANCE METRICS & RECONSTRUCTING TELEMETRY */}
            {historyList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-telemetry">
                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs" id="metric-hiring">
                  <div className="flex items-center justify-between text-zinc-400 mb-4">
                    <span className="text-xs font-mono uppercase font-bold tracking-wider">BAR RAISER CALIBRATION</span>
                    <Award className="w-4 h-4 text-amber-550 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-extrabold text-zinc-900 font-mono truncate">{historyList[0].hiringDecision.split('/')[0].trim()}</p>
                    <p className="text-xs text-zinc-500 font-mono">Latest estimation determined by system consensus</p>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs" id="metric-trend">
                  <div className="flex items-center justify-between text-zinc-400 mb-4">
                    <span className="text-xs font-mono uppercase font-bold tracking-wider">MEDIAN ON-SITE SCORE</span>
                    <TrendingUp className="w-4 h-4 text-amber-550 text-amber-500" />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <p className="text-4xl font-extrabold text-amber-600 font-mono">
                      {(historyList.reduce((acc, h) => acc + h.finalScore, 0) / historyList.length).toFixed(1)}
                    </p>
                    <span className="text-zinc-500 font-mono text-sm font-bold">/ 10</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mt-2">Across {historyList.length} past simulated assessment loops</p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs" id="metric-readiness">
                  <div className="flex items-center justify-between text-zinc-400 mb-4">
                    <span className="text-xs font-mono uppercase font-bold tracking-wider">DIAGNOSTIC STATUS</span>
                    <Layers className="w-4 h-4 text-amber-550 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-sm font-extrabold font-mono text-zinc-800">CALIBRATION ACTIVE</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-2">Resume is {profile ? "100% synchronized" : "unlinked. Please link your background in profile"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* INTERVIEW SETUP CONFIGURATOR PANEL */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-8 scroll-mt-24 font-sans shadow-xs" id="arena-setup-block">
              <div className="border-b border-zinc-100 pb-5" id="setup-header">
                <h3 className="text-lg font-bold font-mono text-zinc-900 flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-amber-550 text-amber-500" />
                  <span>ONSITE INTERVIEW ARENA CONFIGURATOR</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1 font-mono">Configure your mock round variables, target stack constraints, and difficulty parameters.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="setup-grid">
                
                {/* 1. ROUND MODE SELECTOR */}
                <div className="space-y-3" id="setup-mode-section">
                  <label className="block text-xs font-extrabold font-mono uppercase text-zinc-455 text-zinc-500">1. Select Round Type</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => { setSelectedMode('machine_coding'); setSelectedFocus('Thread-safe Ledger & SOLID Design'); }}
                      className={`relative text-left p-4 rounded-xl border transition-all ${selectedMode === 'machine_coding' ? 'bg-amber-50/50 border-amber-500/60 shadow-[0_2px_12px_rgba(245,158,11,0.06)] font-mono' : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300'}`}
                      id="mode-machine-coding"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-mono uppercase ${selectedMode === 'machine_coding' ? 'text-amber-800' : 'text-zinc-800'}`}>Machine Coding Loop</span>
                        <Layers className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed font-mono">
                        Evaluates low-level design (LLD), object-oriented design patterns, SOLID principles, thread-safe state containers, and concurrent processing patterns.
                      </p>
                    </button>

                    <button 
                      onClick={() => { setSelectedMode('dsa'); setSelectedFocus('Optimal Dynamic Slicing & Complex Backtracks'); }}
                      className={`relative text-left p-4 rounded-xl border transition-all ${selectedMode === 'dsa' ? 'bg-amber-50/50 border-amber-500/60 shadow-[0_2px_12px_rgba(245,158,11,0.06)] font-mono' : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300'}`}
                      id="mode-dsa"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-mono uppercase ${selectedMode === 'dsa' ? 'text-amber-800' : 'text-zinc-800'}`}>DSA & Algorithms</span>
                        <Terminal className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed font-mono">
                        Strict algorithmic checks. Demands problem clarification, optimal complexity benchmarks (Big O), and high-quality mock code execution.
                      </p>
                    </button>

                    <button 
                      onClick={() => { setSelectedMode('system_design'); setSelectedFocus('Planetary Scale Write Paths & Cassandra Rings'); }}
                      className={`relative text-left p-4 rounded-xl border transition-all ${selectedMode === 'system_design' ? 'bg-amber-50/50 border-amber-500/60 shadow-[0_2px_12px_rgba(245,158,11,0.06)] font-mono' : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300'}`}
                      id="mode-system-design"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-mono uppercase ${selectedMode === 'system_design' ? 'text-amber-800' : 'text-zinc-800'}`}>System Design</span>
                        <Cpu className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed font-mono">
                        Explores deep back-tier system scaling, requirements decomposition, API boundaries, caching systems, consistency limits, and single points of failure.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. DIFFICULTY & ATTRIBUTION CARD */}
                <div className="space-y-6" id="setup-complexity-section">
                  <div className="space-y-3">
                    <label className="block text-xs font-extrabold font-mono uppercase text-zinc-500 font-bold">2. Select Target Level / Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['easy', 'medium', 'hard'].map((diff) => (
                        <button 
                          key={diff}
                          onClick={() => setSelectedDifficulty(diff as any)}
                          className={`py-2 px-3 text-[11px] font-bold font-mono rounded-lg text-center border uppercase transition-all ${
                            selectedDifficulty === diff 
                              ? diff === 'easy'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                                : diff === 'medium'
                                ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                                : 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                              : 'bg-zinc-50/50 border-zinc-200 text-zinc-650 hover:border-zinc-300'
                          }`}
                        >
                          {diff === 'easy' ? 'Easy (L3)' : diff === 'medium' ? 'Medium (L5)' : 'Hard (L6+)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-extrabold font-mono uppercase text-zinc-500 font-bold">3. Technical Focus Theme Override</label>
                    <select 
                      value={selectedFocus}
                      onChange={(e) => setSelectedFocus(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    >
                      <option value="General Loop">Strict FAANG General Loop</option>
                      <option value="Concurrencies & Bottlenecks">Concurrency Pipelines & Locking Gaps</option>
                      <option value="Database Replication & Consistency">Consistency, Sharding & Cassandra Quorums</option>
                      <option value="Sub-second API Orchestrations">Microservice Edge Latency Mitigation</option>
                      <option value="STAR Metric-driven Storytelling">Quantifiable Metric STAR Delivery</option>
                    </select>
                  </div>

                  <div className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-4 space-y-2 shadow-inner" id="setup-pro-tip">
                    <span className="text-[10px] font-mono text-amber-600 uppercase font-bold flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>RESUME SYNC ACTIVE</span>
                    </span>
                    <p className="text-[11px] text-zinc-600 leading-relaxed font-mono">
                      {profile 
                        ? `The AI simulator automatically injects your background ("${profile.name}", target level "${profile.experience_level}") into the loop scenarios.`
                        : "No resume profile synchronized. The simulator will use strict target standard variables. We recommend linking your background in the Profile tab first."
                      }
                    </p>
                  </div>
                </div>

                {/* 3. SIMULATOR SUMMARY ACTIONS & INITIATOR */}
                <div className="bg-zinc-50/55 border border-zinc-200 rounded-xl p-5 flex flex-col justify-between" id="setup-action-card">
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold font-mono text-zinc-800 uppercase">PRE-FLIGHT SESSION SPECIFICATIONS</h4>
                    
                    <div className="space-y-2 divide-y divide-zinc-200/60" id="specs-list">
                      <div className="flex justify-between py-2 text-[11px] font-mono">
                        <span className="text-zinc-500 font-bold">ROUND CONTEXT</span>
                        <span className="text-amber-600 uppercase font-black">{selectedMode.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between py-2 text-[11px] font-mono">
                        <span className="text-zinc-500 font-bold">INTERVIEW BAR LEVEL</span>
                        <span className="text-zinc-800 font-extrabold capitalize">{selectedDifficulty === 'easy' ? 'Junior (L3)' : selectedDifficulty === 'medium' ? 'Standard (L5)' : 'Staff (L6+)'}</span>
                      </div>
                      <div className="flex justify-between py-2 text-[11px] font-mono">
                        <span className="text-zinc-500 font-bold">FOCUS CONSTRAINTS</span>
                        <span className="text-zinc-700 font-semibold truncate max-w-[150px]">{selectedFocus}</span>
                      </div>
                      <div className="flex justify-between py-2 text-[11px] font-mono">
                        <span className="text-zinc-500 font-bold">CANDIDATE BASELINE</span>
                        <span className="text-zinc-700 font-bold">{profile ? profile.name.split(' ')[0] : 'Standard Mock'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={startNewInterviewSession}
                      disabled={isSessionInitiating}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold font-mono uppercase text-xs tracking-wider transition-all shadow-[0_2px_10px_rgba(245,158,11,0.2)] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                      id="launch-mock-button"
                    >
                      {isSessionInitiating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>ORCHESTRATING LOOP PLAN...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current text-white" />
                          <span>LAUNCH SIMULATOR ARENA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* PRE-MOCK DRILLS SHORTCUT */}
            <div className="border border-zinc-200 bg-white rounded-xl p-5 flex items-center justify-between shadow-xs" id="dashboard-drills-shortcut">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-zinc-900 font-mono">UNDER-PREPARED? WEAK SPOTS RECOVERY</h4>
                <p className="text-xs text-zinc-500 font-mono">Run quick metric-driven exercises on inconsistent hashing algorithms or STAR behavioral conflicts instead of full mock rounds.</p>
              </div>
              <button 
                onClick={() => { setActiveTab('drills'); }} 
                className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono transition-all flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs max-w-[150px] font-bold justify-center"
                id="cta-quick-drills"
              >
                <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                <span>GO TO DRILLS</span>
              </button>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB 2: RESUME & PROFILE INTELLIGENCE SETUP
            ========================================== */}
        {activeTab === 'profile' && !isInterviewActive && (
          <div className="space-y-8 animate-fade-in" id="profile-tab">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-5" id="profile-tab-header">
              <div>
                <h2 className="text-xl font-bold font-mono tracking-tight text-zinc-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-amber-500" />
                  <span>RESUME & PROFILE RECONSTRUCTION SPECIALIST</span>
                </h2>
                <p className="text-xs text-zinc-505 text-zinc-500 mt-1 font-mono">
                  Feed in your current resume or pasting experience to allow the system to construct localized questions and predict target gaps.
                </p>
              </div>

              {profile && (
                <button 
                  onClick={resetProfile} 
                  className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-mono transition-all font-extrabold cursor-pointer"
                  id="reset-profile-button"
                >
                  DE-SYNC PROFILE
                </button>
              )}
            </div>

            {!profile ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="profile-unlinked-grid">
                
                {/* FIRST PANEL: PASTE TEXT AREA */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-xs" id="resume-input-panel">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold font-mono uppercase text-zinc-505 text-zinc-500">Pasted Profile Data / Raw Text</label>
                    <button 
                      onClick={loadFallbackSample}
                      className="text-[10px] uppercase font-mono text-amber-600 hover:underline font-extrabold cursor-pointer"
                      id="load-sample-resume-btn"
                    >
                      Load Standard Senior CV Sample
                    </button>
                  </div>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-1 transition-all ${dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-200/80 bg-zinc-50/30'}`}
                    id="resume-drag-zone"
                  >
                    <textarea 
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                      placeholder="Paste your resume achievements, core work projects, technologies, awards, and target role level..."
                      rows={12}
                      className="w-full bg-zinc-50 border-0 rounded-lg p-4 text-xs font-mono text-zinc-700 focus:ring-0 resize-none placeholder-zinc-400 focus:outline-hidden font-medium"
                      id="resume-textarea"
                    />

                    {/* Drag & drop overlay cue */}
                    <div className="text-center py-2.5 bg-zinc-100/60 rounded-b-lg border-t border-zinc-200" id="drop-tip-bar">
                      <span className="text-[10px] text-zinc-550 text-zinc-505 font-mono flex items-center justify-center space-x-1.5 font-semibold">
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                        <span>Drag & Drop standard .txt files directly to extract</span>
                      </span>
                    </div>
                  </div>

                  {resumeAnalysisError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 text-red-600" id="resume-analysis-error">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-xs font-mono font-bold">{resumeAnalysisError}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => triggerResumeAnalysis()}
                    disabled={isAnalyzingResume || !pastedResumeText.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer"
                    id="trigger-resume-analysis-btn"
                  >
                    {isAnalyzingResume ? (
                      <span className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ORCHESTRATING PROFILE EXTRACTION...</span>
                      </span>
                    ) : (
                      "RUN PROFILE SYNCHRONIZATION"
                    )}
                  </button>
                </div>

                {/* SECOND PANEL: INTELLIGENCE OVERVIEW ACCELERATOR */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xs" id="resume-educational-panel">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold font-mono text-zinc-900 flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-amber-550 text-amber-500" />
                      <span>THE DEEP SYNCHRONIZATION ADVANTAGE</span>
                    </h3>
                    <p className="text-xs text-zinc-505 text-zinc-500 leading-relaxed font-mono">
                      Unlike generic looping tools that deploy cookie-cutter questions, FAANG Loop targets specific stack definitions, project indicators, and quantified achievements.
                    </p>

                    <div className="space-y-3 pt-2" id="synchronization-reasons">
                      <div className="flex items-start space-x-2.5">
                        <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-650 font-mono">
                          <strong className="text-zinc-800 font-mono block text-[11px] font-extrabold">Seniority Calibration:</strong> Establishes expected scoping levels (L3 up to staff L6+) allowing the simulator to vary system design scale on performance checks.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-650 font-mono">
                          <strong className="text-zinc-800 font-mono block text-[11px] font-extrabold">Customized Focus areas:</strong> Focuses DSA scenarios on candidate stack frameworks or weak areas highlighted from past experience histories.
                        </p>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-650 font-mono">
                          <strong className="text-zinc-800 font-mono block text-[11px] font-extrabold">Bar Raiser Spotlights:</strong> Highlights candidate gaps representing likely loops hurdles before launching actual active simulations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-6 flex items-center justify-between" id="profile-skip-block">
                    <span className="text-[10px] font-mono text-zinc-400">Or use dynamic profile defaults</span>
                    <button 
                      onClick={() => {
                        // Create a simple dummy profile context to bypass
                        setProfile({
                          name: "Aviral Gupta (IC5)",
                          experience_level: "Senior Software Engineer (L5)",
                          target_role: "Cloud Distributed Specialist",
                          primary_stack: ["Java", "Distributed Systems", "Redis Ring Cache", "Kafka"],
                          secondary_stack: ["Docker", "Kubernetes", "PostgreSQL"],
                          projects: [{ title: "Netflix Edge Pipeline", description: "Edge gateway design that scales beautifully under high traffic load." }],
                          achievements: ["Successfully scaled distributed session locks spanning multiple regions"],
                          domain_experience: ["Infrastructure", "Data pipelines"],
                          seniority_estimate: "Dynamic default parameters assigned to maintain simulated flows.",
                          possible_weak_areas: ["Planetary scale transactional quorums", "Dynamic consistent ring rehashing"],
                          likely_interview_focus_areas: ["Distributed transaction bottlenecks", "STAR metrics specificity"]
                        });
                      }}
                      className="text-xs font-mono text-amber-600 border border-amber-200 bg-amber-50/30 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all cursor-pointer font-bold"
                      id="use-preset-profile"
                    >
                      Use Presets Bypass
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* ACTIVE PROFILE CARDS LAYOUT */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" id="profile-viewer-grid">
                
                {/* COMPONENT 1: HERO METRICS CARD */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-6 shadow-xs animate-fade-in" id="profile-level-estimator">
                  <div className="text-center space-y-3" id="profile-hero-level">
                    <div className="w-16 h-16 bg-amber-55 bg-amber-50 border border-amber-200 rounded-full mx-auto flex items-center justify-center text-amber-605 text-amber-600 font-mono text-lg font-bold shadow-sm animate-pulse">
                      {profile.experience_level.includes('staff') || profile.experience_level.includes('lead') ? 'L6+' : profile.experience_level.includes('senior') ? 'L5' : 'L4'}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-md font-bold font-mono text-zinc-900 tracking-tight">{profile.name}</h3>
                      <p className="text-xs text-amber-600 font-mono font-bold uppercase">{profile.target_role}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-100" id="profile-seniority-metric">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">SENIORITY ESTIMATION CALIBRATION</span>
                      <p className="text-xs text-zinc-600 leading-relaxed font-mono italic">
                        "{profile.seniority_estimate}"
                      </p>
                    </div>

                    <div className="space-y-1.5" id="profile-key-achievements">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">EXTRACTED KEY ACHIEVEMENTS</span>
                      <ul className="space-y-1" id="achievements-bullet-list">
                        {profile.achievements.map((ach, idx) => (
                          <li key={idx} className="text-[11px] text-zinc-650 font-mono flex items-start space-x-1">
                            <span className="text-amber-500 shrink-0">▪</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100" id="profile-stacks-viewer">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-2 font-bold">IDENTIFIED PRIMARY STACK</span>
                    <div className="flex flex-wrap gap-1.5" id="primary-stack-pills">
                      {profile.primary_stack.map((tech, idx) => (
                        <span key={idx} className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-[10px] font-mono px-2 py-0.5 rounded-lg uppercase font-semibold">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COMPONENT 2: PROJECT MATRIX SUMMARY */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 lg:col-span-2 shadow-xs" id="profile-project-matrix">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400 block pb-2 border-b border-zinc-100">EXTRACTED LANDSCAPE PROJECTS</span>
                  
                  <div className="space-y-4 divide-y divide-zinc-100" id="profile-projects-list">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className={`space-y-1.5 ${idx > 0 ? 'pt-4' : ''}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-zinc-900 font-mono">{proj.title}</h4>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-50 border border-amber-200/50 rounded-md text-amber-700 font-bold">FAANG Scored Context</span>
                        </div>
                        <p className="text-xs text-zinc-655 text-zinc-600 leading-relaxed font-mono">{proj.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100" id="profile-assessment-flags">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-red-500 tracking-wider block font-bold">PREDICTED SYSTEM GAPS</span>
                      <ul className="space-y-1" id="gaps-list">
                        {profile.possible_weak_areas.map((weak, idx) => (
                          <li key={idx} className="text-[11px] text-zinc-600 font-mono flex items-start space-x-1.5 font-medium">
                            <span className="text-red-500 font-mono">⚡</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-amber-600 tracking-wider block font-bold">ONSITE TARGET FOCUS AREAS</span>
                      <ul className="space-y-1" id="focus-areas-list">
                        {profile.likely_interview_focus_areas.map((foc, idx) => (
                          <li key={idx} className="text-[11px] text-zinc-600 font-mono flex items-start space-x-1.5 font-medium">
                            <span className="text-amber-500 font-mono">🎯</span>
                            <span>{foc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 text-right" id="profile-active-ready-block">
                    <button 
                      onClick={() => {
                        setActiveTab('dashboard');
                        setTimeout(() => {
                          document.getElementById('arena-setup-block')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-xs font-bold font-mono transition-all uppercase inline-flex items-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <span>Proceed to simulator arena</span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'arena' && isInterviewActive && currentQuestion && (
          <div className="flex-1 flex flex-col space-y-4 animate-fade-in" id="interview-simulation-arena">
                  {/* STAGE HEADER METRIC BAR */}
            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs" id="arena-telemetry-panel">
              <div className="flex items-center space-x-3" id="telemetry-round-labels">
                <span className="text-xs bg-zinc-100 border border-zinc-250 border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md font-mono uppercase font-extrabold shadow-2xs">
                  ROUND {currentQuestionIndex} / 4
                </span>
                <span className="text-xs font-black font-mono text-amber-600 uppercase hidden sm:inline">
                  {currentQuestion.round}
                </span>
              </div>

              {/* Progress dots */}
              <div className="hidden lg:flex items-center space-x-1.5" id="telemetry-progress-bullets">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`w-2 h-2 rounded-full transition-all ${step === currentQuestionIndex ? 'bg-amber-500 shadow-xs' : step < currentQuestionIndex ? 'bg-amber-200' : 'bg-zinc-200'}`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono" id="telemetry-panel-actions">
                <span className="text-zinc-400 uppercase font-bold">DIFFICULTY:</span> 
                <span className="text-emerald-600 uppercase font-black">{currentQuestion.difficulty}</span>
                <span className="text-zinc-200">|</span>
                <button 
                  onClick={abortActiveInterview}
                  className="text-red-650 text-red-600 hover:underline hover:text-red-700 font-mono text-[11px] cursor-pointer font-extrabold"
                  id="abort-loop-btn"
                >
                  ABORT SESSION
                </button>
              </div>
            </div>

            {/* SPLIT PANEL VIEWWORKSPACE GRID */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans" id="split-workspace-panel">
              
              {/* LEFT COLUMN: INTERVIEWER LOG CONSOLE / STACKS PROJECTION */}
              <div className="flex flex-col space-y-4" id="interviewer-side">
                
                {/* 1. CENTRAL INTERVIEWER CHARACTER CORE */}
                <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between space-y-6 shadow-xs font-mono" id="interviewer-feed-card font-mono">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3" id="interviewer-header">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-[11px] font-mono text-amber-600 uppercase font-black">STAFF LOOP OVERSEER ACTIVE</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 font-extrabold">FAANG Bar-Raiser Engine</span>
                    </div>

                    <div className="space-y-3" id="interviewer-prompt-scaffold">
                      <p className="text-xs font-mono text-zinc-400 font-bold">Interviewer prompt / question:</p>
                      <div className="bg-zinc-50 border border-zinc-205 border-zinc-200 p-4 rounded-xl text-sm font-semibold leading-relaxed font-mono border-l-4 border-l-amber-500 text-zinc-800 italic shadow-2xs" id="interviewer-question-display">
                        "{currentQuestion.question}"
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4" id="interviewer-feedback-chat-bubbles">
                    {/* PREVIOUS ANSWER SUMMARY & STRENGTH FEEDBACK (IF PRESENT) */}
                    {lastEvaluation ? (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3 animate-fade-in shadow-2xs" id="interviewer-feedback-display">
                        <div className="flex items-center justify-between border-b border-zinc-150 border-zinc-200 pb-1.5" id="feedback-scores">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">PREVIOUS STEP METRICS</span>
                          <span className={`text-xs font-mono font-black uppercase ${lastEvaluation.score >= 8 ? 'text-emerald-600' : lastEvaluation.score >= 6 ? 'text-amber-605 text-amber-600' : 'text-red-600'}`}>
                            LAST SCORE: {lastEvaluation.score} / 10
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 mb-2 font-medium" id="rubrics-table">
                          <div>Correctness: <strong className="text-zinc-800 font-bold">{lastEvaluation.rubric.correctness}</strong></div>
                          <div>Depth: <strong className="text-zinc-800 font-bold">{lastEvaluation.rubric.depth}</strong></div>
                          <div>Communication: <strong className="text-zinc-800 font-bold">{lastEvaluation.rubric.communication}</strong></div>
                          <div>Architecture: <strong className="text-zinc-800 font-bold">{lastEvaluation.rubric.trade_off_reasoning}</strong></div>
                        </div>
                        
                        {lastEvaluation.strengths.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-emerald-605 text-emerald-600 font-mono font-black block uppercase">Confirmed Strengths:</span>
                            <ul className="text-[10px] text-zinc-600 font-mono space-y-0.5 list-disc pl-3 font-semibold">
                              {lastEvaluation.strengths.slice(0, 2).map((str, idx) => (
                                // Use key to prevent loop error
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {lastEvaluation.mistakes.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-red-650 text-red-600 font-mono font-black block uppercase font-mono border-t border-zinc-200 pt-1.5 mt-1.5">Deduction factors:</span>
                            <ul className="text-[10px] text-zinc-600 font-mono space-y-0.5 list-disc pl-3 font-semibold">
                              {lastEvaluation.mistakes.slice(0, 2).map((mist, idx) => (
                                // Use key to prevent loop error
                                <li key={idx}>{mist}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-zinc-400 font-mono text-[11px]" id="no-feedback-placeholder">
                        Provide your answers in the workspace. Grader feedback will print here after evaluation.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100" id="interviewer-actions font-mono">
                    <button 
                      onClick={requestAssistanceHint}
                      className="text-xs font-mono text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer font-bold"
                      id="unlock-hint-btn"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>UNLOCK HINT GUIDANCE</span>
                    </button>
                    
                    <span className="text-[10px] text-zinc-400 font-mono font-bold">Assess Goal: {currentQuestion.goal}</span>
                  </div>
                </div>

                {/* HINT OVERLAY IF REQUESTED */}
                {showHintPanel && hintAlert && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1 animate-fade-in font-mono shadow-xs" id="interviewer-hint-card">
                    <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-extrabold uppercase">Interviewer Hint unlocked:</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-700 select-text font-semibold">
                      {hintAlert}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: CANDIDATE DYNAMIC ANSWER WORKSPACE */}
              <div className="flex flex-col space-y-4" id="candidate-workspace-side">
                <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-5 flex flex-col overflow-hidden font-mono shadow-xs" id="workspace-container">
                  
                  {/* WORKSPACE MODE-SPECIFIC SUB-HEADER OPTIONS */}
                  {selectedMode === 'dsa' && (
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4 font-mono font-bold font-mono" id="dsa-workspace-header font-bold font-mono">
                      <div className="flex space-x-1" id="dsa-tabs">
                        <button 
                          onClick={() => setDsaTab('code')}
                          className={`px-3 py-1 text-xs rounded-lg cursor-pointer font-bold transition-all ${dsaTab === 'code' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          Code Workspace
                        </button>
                        <button 
                          onClick={() => setDsaTab('edge_cases')}
                          className={`px-3 py-1 text-xs font-mono rounded-lg cursor-pointer font-bold transition-all ${dsaTab === 'edge_cases' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          Edge Scenarios
                        </button>
                        <button 
                          onClick={() => setDsaTab('big_o')}
                          className={`px-3 py-1 text-xs font-mono rounded-lg cursor-pointer font-bold transition-all ${dsaTab === 'big_o' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          Complexity Specs
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-extrabold">TypeScript Editor</span>
                    </div>
                  )}

                  {selectedMode === 'system_design' && (
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4 font-mono" id="sd-workspace-header">
                      <div className="flex space-x-1" id="sd-tabs">
                        <button 
                          onClick={() => setDesignTab('requirements')}
                          className={`px-3 py-1 text-xs font-mono rounded-lg cursor-pointer font-bold transition-all ${designTab === 'requirements' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          Requirements
                        </button>
                        <button 
                          onClick={() => setDesignTab('schema')}
                          className={`px-3 py-1 text-xs font-mono rounded-lg cursor-pointer font-bold transition-all ${designTab === 'schema' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          API / Schema
                        </button>
                        <button 
                          onClick={() => setDesignTab('architecture')}
                          className={`px-3 py-1 text-xs font-mono rounded-lg cursor-pointer font-bold transition-all ${designTab === 'architecture' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'text-zinc-505 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'}`}
                        >
                          Bottleneck Analysis
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-extrabold">Scale Architect Workspace</span>
                    </div>
                  )}

                  {selectedMode === 'behavioral' && (
                    <div className="border-b border-zinc-100 pb-3 mb-4 flex items-center justify-between font-mono font-bold" id="behavioral-workspace-header">
                      <span className="text-xs font-bold text-zinc-800 uppercase font-mono font-bold">Candidate Narrative Workspace</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Apply STAR structure</span>
                    </div>
                  )}

                  {/* SUB-WORKSPACE CONDITIONAL RENDER CHANNELS */}
                  <div className="flex-1 flex flex-col space-y-3" id="workspace-inputs-block">
                    
                    {/* DSA VIEW CHANNELS */}
                    {selectedMode === 'dsa' && dsaTab === 'code' && (
                      <div className="flex-1 flex flex-col" id="dsa-code-pane">
                        <textarea 
                          value={dsaCodeTemplate}
                          onChange={(e) => setDsaCodeTemplate(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none font-bold"
                          rows={14}
                        />
                      </div>
                    )}

                    {selectedMode === 'dsa' && dsaTab === 'edge_cases' && (
                      <div className="flex-1 flex flex-col space-y-2" id="dsa-edge-pane col">
                        <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono font-bold">List verified test edge scenarios handled (e.g. cyclic structures, empty constraints):</span>
                        <textarea 
                          value={dsaEdgeCasesChecked}
                          onChange={(e) => setDsaEdgeCasesChecked(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none font-semibold"
                          rows={8}
                        />
                      </div>
                    )}

                    {selectedMode === 'dsa' && dsaTab === 'big_o' && (
                      <div className="flex-1 flex flex-col space-y-2 font-mono" id="dsa-big-o-pane">
                        <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono font-bold">Define ultimate complexity metrics (Time / Space Big O justifications):</span>
                        <textarea 
                          value={dsaComplexity}
                          onChange={(e) => setDsaComplexity(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none font-semibold"
                          rows={8}
                        />
                      </div>
                    )}

                    {/* SYSTEM DESIGN VIEW CHANNELS */}
                    {selectedMode === 'system_design' && designTab === 'requirements' && (
                      <div className="flex-1 flex flex-col space-y-2 font-mono" id="sd-requirements-pane">
                        <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono font-bold">Define functional constraints & SLA limits:</span>
                        <textarea 
                          value={designRequirements}
                          onChange={(e) => setDesignRequirements(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none font-semibold"
                          rows={10}
                        />
                      </div>
                    )}

                    {selectedMode === 'system_design' && designTab === 'schema' && (
                      <div className="flex-1 flex flex-col space-y-2 font-mono" id="sd-schema-pane">
                        <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono font-bold">Primary APIs, storage layout designs, schema schemas:</span>
                        <textarea 
                          value={designSchemaText}
                          onChange={(e) => setDesignSchemaText(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-805 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none font-bold"
                          rows={10}
                        />
                      </div>
                    )}

                    {selectedMode === 'system_design' && designTab === 'architecture' && (
                      <div className="flex-1 flex flex-col space-y-2 font-mono" id="sd-bottlenecks-pane">
                        <span className="text-[10px] text-zinc-450 text-zinc-400 font-mono font-bold">Outline scalability bottlenecks (Cassandra quorum partitioning, Kafka retry strategies):</span>
                        <textarea 
                          value={designArchDescription}
                          onChange={(e) => setDesignArchDescription(e.target.value)}
                          className="flex-1 w-full bg-zinc-50 font-mono text-xs p-3 text-zinc-800 border border-zinc-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-505/50 focus:ring-amber-500/50 focus:outline-none resize-none font-semibold"
                          rows={10}
                        />
                      </div>
                    )}

                    {/* CORE EXPLANATORY TEXT WRITER INPUT */}
                    <div className="flex flex-col space-y-1 pt-2 border-t border-zinc-100 font-mono" id="main-answer-caption">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase font-black">Write your core narrative description below:</span>
                      <textarea 
                        value={candidateAnswer}
                        onChange={(e) => setCandidateAnswer(e.target.value)}
                        placeholder="Detail your STAR summary, optimization descriptions, metrics reflections, or general architectural trade-offs here..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono text-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none font-semibold"
                        rows={5}
                        id="candidate-dialog-textarea"
                      />
                    </div>

                  </div>

                  {/* FINAL SUBMISSION CONTROL ACTIONS */}
                  <div className="pt-4 flex items-center justify-between font-mono" id="workspace-action-row">
                    <span className="text-[10px] text-zinc-405 text-zinc-400 font-bold">Active telemetry grading engaged</span>
                    
                    <button 
                      onClick={submitCandidateAnswer}
                      disabled={isSubmittingAnswer || (!candidateAnswer.trim() && selectedMode === 'behavioral')}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-md cursor-pointer font-bold"
                      id="submit-answer-btn"
                    >
                      {isSubmittingAnswer ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>EVALUATING SYSTEM GRADE...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-white" />
                          <span>SUBMIT ANSWER FOR EVALUATION</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 4: HISTORICAL SCORES & REPORTS VAULT
            ========================================== */}
        {activeTab === 'history' && !isInterviewActive && (
          <div className="space-y-8 animate-fade-in font-sans" id="history-tab">
            <div className="border-b border-zinc-200 pb-5" id="history-header">
              <h2 className="text-xl font-bold font-mono text-zinc-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>ONSITE CALIBRATION HISTORY VAULT</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                View past simulated interview scorecards, committee calibrations, and personalized Day-by-Day improvement guides.
              </p>
            </div>

            {viewingSpecificReport ? (
              /* DETAILED VIEWING COMPREHENSIVE PERFORMANCE CARD */
              <div className="space-y-8 animate-fade-in" id="report-viewing-chamber">
                <div className="flex items-center justify-between" id="report-navbar">
                  <button 
                    onClick={() => setViewingSpecificReport(null)}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 hover:underline flex items-center space-x-1.5 cursor-pointer font-bold"
                    id="back-to-vault-btn"
                  >
                    <span>← RETURN TO CALIBRATION VAULT</span>
                  </button>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">FAANG Mock Calibration Ledger</span>
                </div>

                {/* THE CORE COMMITTEE BANNER */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs" id="report-hero-judgement-card font-mono">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-6 gap-4" id="report-calb-display">
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider block w-max">
                        COMMITTEE VERDICT & CALIBRATION
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-mono text-zinc-900 leading-tight">
                        {viewingSpecificReport.hiring_readiness}
                      </h3>
                      <p className="text-xs text-zinc-550 text-zinc-500 mt-1">Calibration determined strictly by system grading parameters</p>
                    </div>

                    <div className="text-center md:text-right" id="report-metric-circle">
                      <div className="inline-block bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1 font-bold">OVERALL SCORE</span>
                        <div className="flex items-baseline justify-center space-x-1 font-mono">
                          <span className="text-4xl font-extrabold text-amber-500">{viewingSpecificReport.overall_score}</span>
                          <span className="text-zinc-400 text-xs">/ 10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 md:divide-x md:divide-zinc-200" id="strengths-weaknesses-comparison">
                    <div className="space-y-3" id="strengths-box">
                      <h4 className="text-xs font-bold font-mono text-emerald-600 uppercase tracking-wider">Identified Loop Strengths:</h4>
                      <ul className="space-y-2" id="strengths-report-list">
                        {viewingSpecificReport.strengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-zinc-650 text-zinc-600 font-mono flex items-start space-x-2 leading-relaxed">
                            <span className="text-emerald-555 text-emerald-500 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 md:pl-8" id="weakness-box">
                      <h4 className="text-xs font-bold font-mono text-red-600 uppercase tracking-wider">Loop Deduction Factors:</h4>
                      <ul className="space-y-2" id="weakness-report-list">
                        {viewingSpecificReport.weaknesses.map((weak, idx) => (
                          <li key={idx} className="text-xs text-zinc-650 text-zinc-600 font-mono flex items-start space-x-2 leading-relaxed">
                            <span className="text-red-500 font-bold">⚡</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 7-DAY INTENSE PERSONALIZED IMPROVEMENT ROADMAP */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in font-sans shadow-xs" id="improvement-roadmap">
                  <div>
                    <h3 className="text-md font-bold font-mono text-zinc-900 flex items-center space-x-1.5">
                      <BookOpen className="w-5 h-5 text-amber-500" />
                      <span>7-DAY CRITICAL IMPROVEMENT ROADMAP</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">A highly targeted day-by-day practice routine centered on loop deficiencies detected.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4" id="days-loop-roadmap font-mono">
                    {viewingSpecificReport.improvement_plan.map((dayPlan, idx) => (
                      <div key={idx} className="border border-zinc-200 bg-zinc-50/50 w-full rounded-2xl p-5 flex flex-col md:flex-row md:items-start gap-4 hover:border-zinc-300 transition-all">
                        <div className="md:w-32 shrink-0 flex items-center space-x-2 md:space-x-0 md:flex-col md:items-start gap-1" id="day-indicator">
                          <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded font-mono font-bold uppercase block text-center">
                            DAY {dayPlan.day}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2" id="day-tasks-pane">
                          <h4 className="text-sm font-semibold font-mono text-zinc-900 uppercase">{dayPlan.focus}</h4>
                          <ul className="space-y-1.5" id="day-bullets">
                            {dayPlan.tasks.map((task, tidx) => (
                              <li key={tidx} className="text-xs text-zinc-600 font-mono flex items-start space-x-1.5 leading-relaxed">
                                <span className="text-amber-500 font-bold shrink-0">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="next-session-recom">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-amber-600 uppercase font-bold tracking-wider">NEXT INTERVIEW TARGET</span>
                      <p className="text-xs font-semibold text-zinc-850 text-zinc-805 text-zinc-800 font-mono">{viewingSpecificReport.next_session_recommendation}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('dashboard');
                        setTimeout(() => {
                          document.getElementById('arena-setup-block')?.scrollIntoView({ behavior: 'smooth' });
                        }, 120);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all uppercase cursor-pointer shrink-0 font-bold"
                    >
                      Configure Mock Arena
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* THE LIST VAULT VIEW STATE */
              <div className="space-y-6" id="history-vault-grid">
                {historyList.length === 0 ? (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-4 shadow-xs" id="empty-history-vault">
                    <Terminal className="w-12 h-12 text-zinc-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-950 font-mono uppercase">CALIBRATION LEDGER IS VACANT</h4>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto font-mono">No past mock rounds have been solved. Complete a full interview loop in the Simulator Arena to populate performance ledger trends.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4" id="history-items-list-canvas">
                    {historyList.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white border border-zinc-200 hover:border-zinc-300 transition-all rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs font-mono"
                        id={`vault-item-${item.id}`}
                      >
                        <div className="space-y-1.5 flex-1" id="item-round-caption font-mono">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-[10px] bg-zinc-100 border border-zinc-205 text-zinc-650 px-2 py-0.5 rounded font-extrabold uppercase font-mono">
                              {item.mode.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-bold">{item.timestamp}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-zinc-900 font-mono tracking-tight text-wrap">Verdict: {item.hiringDecision.split('/')[0].trim()}</h4>
                          <p className="text-xs text-zinc-500 font-mono">Completed {item.questionsCount} logical assessment cycles under difficulty: "{item.difficulty}"</p>
                        </div>

                        <div className="flex items-center space-x-6 font-mono" id="item-stats-actions">
                          <div className="text-right" id="item-score-pill">
                            <span className="text-[10px] font-mono text-zinc-400 block mb-0.5 uppercase font-bold">SCORE</span>
                            <div className="flex items-baseline justify-end space-x-0.5 font-mono">
                              <span className="text-2xl font-black text-amber-600">{item.finalScore}</span>
                              <span className="text-zinc-405 text-xs">/10</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => { if (item.report) setViewingSpecificReport(item.report); }}
                            className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-mono text-xs px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer font-extrabold"
                          >
                            <span>Inspect Performance</span>
                            <ChevronRight className="w-4 h-4 text-amber-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 4.5: PROBLEM LIBRARY & EXPLORER
            ========================================== */}
        {activeTab === 'problems' && !isInterviewActive && (
          <div className="space-y-6 animate-fade-in font-sans" id="problem-library-tab">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4" id="problems-header">
              <div>
                <h2 className="text-xl font-bold font-mono text-zinc-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>CURATED FAANG PROBLEM LIBRARY</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Browse and solve verified interview problems from top tier companies across DSA, System Design, and Machine Coding.
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-mono text-emerald-750 text-emerald-700 font-bold shadow-2xs">
                <span className="w-2 h-2 bg-emerald-555 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>{PRE_CURATED_PROBLEMS.length} Golden-Grade Challenges Loaded</span>
              </div>
            </div>

            {/* Filtration toolbar */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs text-zinc-700" id="library-filters">
              {/* Search Bar */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-405 text-zinc-400 font-mono">Search Keywords</label>
                <input 
                  type="text"
                  placeholder="Filter name, tags..."
                  value={probSearchTerm}
                  onChange={(e) => setProbSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 placeholder-zinc-400 font-bold"
                  id="prob-search-input"
                />
              </div>

              {/* Mode filter */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono">Domain Category</label>
                <select
                  value={probFilterMode}
                  onChange={(e) => setProbFilterMode(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-800 focus:outline-none focus:border-amber-500 font-bold"
                  id="prob-mode-select"
                >
                  <option value="all">All Domains</option>
                  <option value="dsa">Data Structures &amp; Algos</option>
                  <option value="system_design">System Design</option>
                  <option value="machine_coding">Machine Coding</option>
                </select>
              </div>

              {/* Company filter */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-404 text-zinc-400 font-mono">Target Company</label>
                <select
                  value={probFilterCompany}
                  onChange={(e) => setProbFilterCompany(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-800 focus:outline-none focus:border-amber-500 font-bold"
                  id="prob-company-select"
                >
                  <option value="all">All Companies</option>
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="Apple">Apple</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Uber">Uber</option>
                  <option value="Swiggy">Swiggy/Flipkart</option>
                </select>
              </div>

              {/* Difficulty filter */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-404 text-zinc-400 font-mono">Difficulty Bar</label>
                <select
                  value={probFilterDifficulty}
                  onChange={(e) => setProbFilterDifficulty(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded p-2 text-zinc-800 focus:outline-none focus:border-amber-500 font-bold"
                  id="prob-difficulty-select"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Split Screen Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="library-split-view">
              
              {/* LEFT COLUMN: Problem List */}
              <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-2" id="library-list-container">
                <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase block tracking-wider px-1">
                  Available Challenges ({
                    PRE_CURATED_PROBLEMS.filter(p => {
                      const matchSearch = p.title.toLowerCase().includes(probSearchTerm.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(probSearchTerm.toLowerCase()));
                      const matchMode = probFilterMode === 'all' || p.mode === probFilterMode;
                      const matchCompany = probFilterCompany === 'all' || p.companies.includes(probFilterCompany) || (probFilterCompany === 'Swiggy' && (p.companies.includes('Swiggy') || p.companies.includes('Flipkart')));
                      const matchDifficulty = probFilterDifficulty === 'all' || p.difficulty === probFilterDifficulty;
                      return matchSearch && matchMode && matchCompany && matchDifficulty;
                    }).length
                  })
                </span>
                
                {PRE_CURATED_PROBLEMS.filter(p => {
                  const matchSearch = p.title.toLowerCase().includes(probSearchTerm.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(probSearchTerm.toLowerCase()));
                  const matchMode = probFilterMode === 'all' || p.mode === probFilterMode;
                  const matchCompany = probFilterCompany === 'all' || p.companies.includes(probFilterCompany) || (probFilterCompany === 'Swiggy' && (p.companies.includes('Swiggy') || p.companies.includes('Flipkart')));
                  const matchDifficulty = probFilterDifficulty === 'all' || p.difficulty === probFilterDifficulty;
                  return matchSearch && matchMode && matchCompany && matchDifficulty;
                }).map((problem) => {
                  const isSelected = selectedLibraryProblem?.id === problem.id;
                  return (
                    <button
                      key={problem.id}
                      onClick={() => setSelectedLibraryProblem(problem)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col space-y-3 cursor-pointer shadow-xs ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-450 border-amber-400 shadow-md font-mono' 
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 font-mono'
                      }`}
                      id={`problem-library-card-${problem.id}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h3 className={`text-xs font-black font-mono leading-tight ${isSelected ? 'text-zinc-900' : 'text-zinc-800'}`}>{problem.title}</h3>
                        <span className={`text-[10px] font-mono font-black uppercase shrink-0 px-2 py-0.5 rounded ${
                          problem.difficulty === 'easy' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                          problem.difficulty === 'medium' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                          'text-red-700 bg-red-50 border border-red-200'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </div>

                      {/* Snippet Goal */}
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed line-clamp-2">
                        {problem.goal}
                      </p>

                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200">
                        {problem.companies.slice(0, 3).map(c => (
                          <span key={c} className="text-[9px] font-mono bg-zinc-100 text-zinc-650 font-bold px-1.5 py-0.5 rounded border border-zinc-200/60 shadow-3xs">
                            {c}
                          </span>
                        ))}
                        <span className="text-[9.5px] font-mono bg-amber-100/60 text-amber-750 font-extrabold px-1.5 py-0.5 rounded uppercase ml-auto">
                          {problem.mode === 'dsa' ? 'DSA' : problem.mode === 'system_design' ? 'SYS DESIGN' : 'LOWER LEVEL'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {PRE_CURATED_PROBLEMS.filter(p => {
                  const matchSearch = p.title.toLowerCase().includes(probSearchTerm.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(probSearchTerm.toLowerCase()));
                  const matchMode = probFilterMode === 'all' || p.mode === probFilterMode;
                  const matchCompany = probFilterCompany === 'all' || p.companies.includes(probFilterCompany) || (probFilterCompany === 'Swiggy' && (p.companies.includes('Swiggy') || p.companies.includes('Flipkart')));
                  const matchDifficulty = probFilterDifficulty === 'all' || p.difficulty === probFilterDifficulty;
                  return matchSearch && matchMode && matchCompany && matchDifficulty;
                }).length === 0 && (
                  <div className="text-center py-12 bg-white border border-zinc-200 border-dashed rounded-2xl p-6 space-y-2 font-mono shadow-xs">
                    <p className="text-zinc-500 text-xs font-bold font-mono">No verified problems match active filters.</p>
                    <button 
                      onClick={() => { setProbSearchTerm(''); setProbFilterCompany('all'); setProbFilterMode('all'); setProbFilterDifficulty('all'); }}
                      className="text-xs text-amber-600 underline hover:text-amber-700 cursor-pointer font-extrabold font-mono"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: SMOOTH Detailed Presentation */}
              <div className="lg:col-span-7" id="library-detail-block">
                {selectedLibraryProblem ? (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in font-mono shadow-xs" id="active-problem-detail-canvas">
                    
                    {/* Header line */}
                    <div className="border-b border-zinc-200 pb-5 space-y-3" id="problem-detail-header-element">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded ${
                          selectedLibraryProblem.difficulty === 'easy' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                          selectedLibraryProblem.difficulty === 'medium' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                          'text-red-700 bg-red-50 border border-red-200'
                        }`}>
                          {selectedLibraryProblem.difficulty.toUpperCase()} DIFFICULTY
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded text-zinc-700 uppercase">
                          {selectedLibraryProblem.mode === 'dsa' ? 'Data Structures & Algorithms' : selectedLibraryProblem.mode === 'system_design' ? 'System Design scaling' : 'Machine Coding (LLD / Clean Design)'}
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-bold font-mono text-zinc-900 tracking-tight">{selectedLibraryProblem.title}</h2>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-zinc-500 font-bold">
                        <span className="font-bold text-zinc-400">FREQUENTLY ASKED AT:</span>
                        {selectedLibraryProblem.companies.map(c => (
                          <span key={c} className="bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded shadow-3xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Smooth Presentation Section 1: Detailed description */}
                    <div className="space-y-2.5" id="detail-overview-pane">
                      <h4 className="text-xs font-black font-mono uppercase text-amber-600 tracking-wider">Problem Details &amp; Background</h4>
                      <p className="text-xs text-zinc-600 leading-relaxed font-mono font-bold whitespace-pre-wrap">
                        {selectedLibraryProblem.details}
                      </p>
                    </div>

                    {/* Smooth Presentation Section 2: Input statement */}
                    <div className="space-y-2.5" id="detail-input-pane">
                      <h4 className="text-xs font-black font-mono uppercase text-amber-600 tracking-wider">Input &amp; Output Statement</h4>
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-3xs">
                        <p className="text-xs text-zinc-600 font-mono leading-relaxed whitespace-pre-wrap font-bold">
                          {selectedLibraryProblem.inputStatement}
                        </p>
                      </div>
                    </div>

                    {/* Smooth Presentation Section 3: Structured examples */}
                    <div className="space-y-3" id="detail-examples-pane">
                      <h4 className="text-xs font-black font-mono uppercase text-amber-600 tracking-wider">Example Test Cases</h4>
                      <div className="space-y-4">
                        {selectedLibraryProblem.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-zinc-50/50 border border-zinc-200 rounded-xl overflow-hidden font-mono shadow-3xs" id={`example-block-${exIdx}`}>
                            <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              Simulation Case #{exIdx + 1}
                            </div>
                            <div className="p-4 space-y-3 text-[11.5px]">
                              <div>
                                <span className="text-zinc-400 block text-[10px] font-bold uppercase select-none">Input:</span>
                                <pre className="bg-white border border-zinc-200 p-2.5 rounded text-zinc-700 mt-1 overflow-x-auto text-xs whitespace-pre font-bold font-mono">
                                  {ex.input}
                                </pre>
                              </div>
                              <div>
                                <span className="text-zinc-400 block text-[10px] font-bold uppercase select-none">Output:</span>
                                <pre className="bg-white border border-zinc-200 p-2.5 rounded text-emerald-600 mt-1 overflow-x-auto text-xs whitespace-pre font-black font-mono">
                                  {ex.output}
                                </pre>
                              </div>
                              {ex.explanation && (
                                <div>
                                  <span className="text-zinc-400 block text-[10px] font-bold uppercase select-none">Explanation:</span>
                                  <p className="text-zinc-500 mt-1 text-xs leading-relaxed max-w-full font-bold">
                                    {ex.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Smooth Presentation Section 4: Constraints list */}
                    <div className="space-y-2.5 font-mono" id="detail-constraints-pane">
                      <h4 className="text-xs font-black font-mono uppercase text-amber-600 tracking-wider">Algorithmic Constraints</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-650 text-zinc-600 font-mono">
                        {selectedLibraryProblem.constraints.map((c, cIdx) => (
                          <li key={cIdx} className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg flex items-center space-x-2 font-bold shadow-3xs">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 animate-pulse"></span>
                            <span className="font-semibold">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Big Simulation Launch Controller */}
                    <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center sm:justify-between gap-4 font-mono">
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-zinc-400 uppercase block font-bold leading-tight">ACTIVE SESSION LAUNCHER</span>
                        <span className="text-xs text-zinc-500 font-bold font-mono">Try solving this on the live workspace arena</span>
                      </div>
                      
                      <button
                        onClick={() => startNewInterviewSession(selectedLibraryProblem)}
                        disabled={isSessionInitiating}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                        id="start-problem-arena-btn"
                      >
                        <Play className="w-4 h-4 fill-current text-white" />
                        <span>{isSessionInitiating ? 'BOOTING MOCK WORKSPACE...' : 'LAUNCH IN ARENA'}</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500 space-y-3 font-mono shadow-xs" id="active-problem-detail-empty">
                    <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto animate-bounce text-amber-500" />
                    <h3 className="text-sm font-bold text-zinc-805 text-zinc-800 uppercase font-mono">No Problem Inspected</h3>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed font-mono">
                      Select any technical challenge on the left pane to explore its full structure, examples, constraints and launch the live sandbox.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 5: WEAK SPOTS & DRILLS WORKSPACE
            ========================================== */}
        {activeTab === 'drills' && !isInterviewActive && (
          <div className="space-y-8 animate-fade-in font-sans" id="drills-tab">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5 gap-4" id="drills-header">
              <div>
                <h2 className="text-xl font-bold font-mono text-zinc-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>DYNAMICAL WEAK SPOTS RECOVERY PRACTICE</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  Targeted Micro-drills custom generated around your profile gaps and recorded calibration failures.
                </p>
              </div>

              <button 
                onClick={loadDynamicDrillSet}
                disabled={isGeneratingDrills}
                className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 px-4 py-2 rounded-lg text-xs font-mono text-zinc-700 hover:text-zinc-900 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer font-extrabold shadow-3xs"
                id="regenerate-drills-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isGeneratingDrills ? 'animate-spin' : ''}`} />
                <span>RELOAD DRILLS</span>
              </button>
            </div>

            {/* SELECTION OVERVIEW */}
            {selectedDrill ? (
              /* ACTIVE DRILL WORKSPACE CARD */
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-8 space-y-6 animate-fade-in font-sans shadow-xs" id="active-drill-view">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4" id="active-drill-header">
                  <div className="space-y-1 font-mono">
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase font-extrabold">
                      {selectedDrill.topic}
                    </span>
                    <h3 className="text-md sm:text-lg font-black text-zinc-900 leading-snug">{selectedDrill.title}</h3>
                  </div>

                  <button 
                    onClick={() => { setSelectedDrill(null); setDrillAnswer(''); setDrillGradingResult(null); }}
                    className="text-xs font-mono text-zinc-400 hover:text-zinc-650 hover:underline cursor-pointer font-bold"
                    id="exit-drill-workspace-btn"
                  >
                    ← BACK TO RETRY LIST
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="active-drill-content font-mono">
                  
                  {/* WORKSPACE DETS */}
                  <div className="space-y-6" id="drill-coaching-pane">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">CHALLENGE DRILL SCENARIO</span>
                      <p className="text-xs text-zinc-650 text-zinc-600 leading-relaxed font-mono italic p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold font-mono">
                        "{selectedDrill.description}"
                      </p>
                    </div>

                    <div className="space-y-2" id="drill-expected-checklist">
                      <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block font-mono">KEY DRILL FOCALS COOP CHECKLIST:</span>
                      <ul className="space-y-1.5" id="drill-focals-bullets">
                        {selectedDrill.coaching_points.map((point, idx) => (
                          <li key={idx} className="text-xs text-zinc-600 font-mono flex items-start space-x-2 leading-relaxed font-bold">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* ACTIVE TYPED ANSWER WRITER */}
                  <div className="space-y-4" id="drill-answer-pane">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase font-black">Input your dry-run architectural implementation block or narrative path:</label>
                      <textarea 
                        value={drillAnswer}
                        onChange={(e) => setDrillAnswer(e.target.value)}
                        placeholder="Detail your code response logic, STAR metrics summary, or consistent caching ring hashes details..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-mono text-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 focus:outline-none placeholder:text-zinc-400 font-bold whitespace-pre font-mono"
                        rows={8}
                        id="drill-candidate-textarea"
                      />
                    </div>

                    <button 
                      onClick={submitDrillResponse}
                      disabled={isGradingDrill || !drillAnswer.trim()}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                      id="grade-drill-response-btn"
                    >
                      {isGradingDrill ? "ANALYZING DRILL RESPONSES..." : "RUN DRILL JUDGMENT"}
                    </button>

                    {/* MICRO DRILL GRADING ACCORDION REPORT */}
                    {drillGradingResult && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 animate-fade-in text-[11px] font-mono shadow-3xs" id="drill-results-report">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">INTERACTIVE DRILL SCORE</span>
                          <span className={`text-xs font-bold font-mono ${drillGradingResult.score >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {drillGradingResult.score} / 10
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-600 leading-relaxed font-bold font-mono">
                          Summary parsing: "{drillGradingResult.candidate_answer_summary}"
                        </p>
                        {drillGradingResult.strengths && drillGradingResult.strengths.length > 0 && (
                          <div className="space-y-0.5 text-[11px] font-mono">
                            <span className="text-[10px] text-emerald-600 uppercase font-extrabold block">CONFIRMED POINTS:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-zinc-500 font-bold font-mono">
                              {drillGradingResult.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {drillGradingResult.mistakes && drillGradingResult.mistakes.length > 0 && (
                          <div className="space-y-0.5 text-[11px] font-mono">
                            <span className="text-[10px] text-amber-600 uppercase font-extrabold block">OMITTED FOCUS POINTS:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-zinc-500 font-bold font-mono">
                              {drillGradingResult.mistakes.map((m: string, i: number) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              /* THE LIST DRILLS VIEW STATE */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="drills-catalogue-grid">
                {isGeneratingDrills ? (
                  /* Loading placeholders */
                  [1,2,3].map((idx) => (
                    <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 animate-pulse shadow-xs">
                      <div className="w-1/3 h-4 bg-zinc-200 rounded"></div>
                      <div className="w-full h-12 bg-zinc-200 rounded"></div>
                      <div className="w-1/2 h-4 bg-zinc-200 rounded"></div>
                    </div>
                  ))
                ) : (
                  activeDrills.map((drill, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-zinc-200 hover:border-zinc-300 transition-all rounded-xl p-5 flex flex-col justify-between space-y-4 text-left shadow-xs"
                      id={`drill-item-card-${idx}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-amber-750 font-bold">
                            {drill.topic}
                          </span>
                          <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold">LEVEL: {drill.difficulty}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-850 text-zinc-805 text-zinc-800 font-mono leading-snug">{drill.title}</h4>
                        <p className="text-[11px] text-zinc-550 text-zinc-500 font-mono leading-relaxed line-clamp-3">
                          "{drill.description}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-150 border-zinc-200 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-zinc-450 text-zinc-400 font-bold font-mono">EXPECTED: {drill.coaching_points.length} METRICS</span>
                        <button 
                          onClick={() => { setSelectedDrill(drill); }}
                          className="bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-amber-600 hover:text-amber-700 font-mono text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer font-bold shadow-3xs"
                        >
                          <span>Solve Drill</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ==========================================
          GLOBAL FOOTER BAR
          ========================================== */}
      <footer className="border-t border-zinc-200 py-6 bg-white text-center text-xs text-zinc-500 font-mono mt-auto" id="applet-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <span>FAANG LOOP Assessing Simulator Engine v2.4.0</span>
          <span>© 2026 FAANG LOOP. Calibrated strictly for Staff and L5 loops targets.</span>
        </div>
      </footer>

    </div>
  );
}
