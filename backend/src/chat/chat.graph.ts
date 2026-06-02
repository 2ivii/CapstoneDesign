import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { Repository } from 'typeorm';
import { SolutionCache } from '../entities/solution-cache.entity';
import {
  SYSTEM_PROMPT,
  MATH_SYSTEM,
  KOREAN_SYSTEM,
  ENGLISH_SYSTEM,
  SCIENCE_SYSTEM,
  SOCIAL_SYSTEM,
  CLASSIFY_PROMPT,
  VALIDATE_IMAGE_PROMPT,
  DETECT_PROBLEMS_PROMPT,
  IDENTIFY_QUESTION_PROMPT,
  VERIFY_SOLUTION_PROMPT,
} from './prompts/solver.prompt';

export interface ConversationEntry {
  sender: string;
  content: string;
}

const GraphAnnotation = Annotation.Root({
  image: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  mimeType: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  subject: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  userMessage: Annotation<string | undefined>({
    reducer: (_, n) => n,
    default: () => undefined,
  }),
  conversationHistory: Annotation<ConversationEntry[]>({
    reducer: (_, n) => n,
    default: () => [],
  }),
  solution: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  conceptTags: Annotation<string[]>({ reducer: (_, n) => n, default: () => [] }),
  isValid: Annotation<boolean>({ reducer: (_, n) => n, default: () => true }),
  errorMessage: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  problemCount: Annotation<number>({ reducer: (_, n) => n, default: () => 1 }),
  confidence: Annotation<'high' | 'medium' | 'low'>({
    reducer: (_, n) => n,
    default: () => 'high',
  }),
  warningMessage: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  examId: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),
  questionNo: Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),
  cacheHit: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
});

type GraphState = typeof GraphAnnotation.State;

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function buildImageUrl(image: string, mimeType: string): string {
  return `data:${mimeType};base64,${image}`;
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as T) : fallback;
  } catch {
    return fallback;
  }
}

function extractAnswer(solution: string): string {
  const match = solution.match(/##\s*정답\s*\n([^\n]+)/);
  return match ? match[1].trim().substring(0, 10) : '';
}

// ── 이미지 검증 ──────────────────────────────────────────────────────────────

async function validateImage(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.image) return { isValid: true };

  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 50,
    temperature: 0,
  });

  const response = await model.invoke([
    new HumanMessage({
      content: [
        { type: 'text', text: VALIDATE_IMAGE_PROMPT },
        { type: 'image_url', image_url: { url: buildImageUrl(state.image, state.mimeType) } },
      ],
    }),
  ]);

  const parsed = parseJson<{ valid?: boolean; reason?: string }>(
    response.content as string,
    { valid: true },
  );

  if (parsed.valid === false) {
    return {
      isValid: false,
      errorMessage: parsed.reason ?? '문제 이미지를 인식할 수 없습니다.',
    };
  }
  return { isValid: true };
}

// ── 에러 반환 ─────────────────────────────────────────────────────────────────

function returnError(state: GraphState): Partial<GraphState> {
  return { solution: state.errorMessage || '이미지를 인식할 수 없습니다.' };
}

// ── 문제 개수 감지 ────────────────────────────────────────────────────────────

async function detectProblems(state: GraphState): Promise<Partial<GraphState>> {
  if (!state.image) return { problemCount: 1 };

  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 30,
    temperature: 0,
  });

  const response = await model.invoke([
    new HumanMessage({
      content: [
        { type: 'text', text: DETECT_PROBLEMS_PROMPT },
        { type: 'image_url', image_url: { url: buildImageUrl(state.image, state.mimeType) } },
      ],
    }),
  ]);

  const raw = (response.content as string).trim();
  const count = parseInt(raw.match(/\d+/)?.[0] ?? '1', 10);
  return { problemCount: isNaN(count) ? 1 : count };
}

// ── 과목 판별 ─────────────────────────────────────────────────────────────────

async function classifySubject(state: GraphState): Promise<Partial<GraphState>> {
  if (state.subject || !state.image) return {};

  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 20,
    temperature: 0,
  });

  const response = await model.invoke([
    new HumanMessage({
      content: [
        { type: 'text', text: CLASSIFY_PROMPT },
        { type: 'image_url', image_url: { url: buildImageUrl(state.image, state.mimeType) } },
      ],
    }),
  ]);

  const raw = (response.content as string).trim();
  const known = ['수학', '국어', '영어', '과학', '사회'];
  const subject = known.find((s) => raw.includes(s)) ?? '기타';
  return { subject };
}

// ── 시험/문항 식별 ─────────────────────────────────────────────────────────────

async function identifyQuestion(state: GraphState): Promise<Partial<GraphState>> {
  // 사용자가 직접 입력했거나 이미지가 없으면 LLM 호출 스킵
  if (!state.image || state.examId) return {};

  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 80,
    temperature: 0,
  });

  const response = await model.invoke([
    new HumanMessage({
      content: [
        { type: 'text', text: IDENTIFY_QUESTION_PROMPT },
        { type: 'image_url', image_url: { url: buildImageUrl(state.image, state.mimeType) } },
      ],
    }),
  ]);

  const parsed = parseJson<{ exam_id?: string; question_no?: number }>(
    response.content as string,
    { exam_id: '', question_no: 0 },
  );

  return {
    examId: parsed.exam_id ?? '',
    questionNo: parsed.question_no ?? 0,
  };
}

// ── 캐시 조회 (클로저) ────────────────────────────────────────────────────────

function createCheckCache(cacheRepo: Repository<SolutionCache>) {
  return async function (state: GraphState): Promise<Partial<GraphState>> {
    if (!state.examId || !state.questionNo) return { cacheHit: false };

    const cached = await cacheRepo.findOne({
      where: { exam_id: state.examId, question_no: state.questionNo },
    });

    if (!cached) return { cacheHit: false };

    return {
      cacheHit: true,
      solution: cached.solution_text,
      conceptTags: cached.concept_tags ?? [],
      confidence: (['high', 'medium', 'low'].includes(cached.confidence)
        ? cached.confidence
        : 'high') as 'high' | 'medium' | 'low',
    };
  };
}

// ── 캐시 기반 후속 답변 ───────────────────────────────────────────────────────

async function answerFromCache(state: GraphState): Promise<Partial<GraphState>> {
  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.3,
  });

  const prompt = `아래는 이 문제의 전체 풀이입니다:\n${state.solution}\n\n학생 질문: ${state.userMessage}\n\n위 풀이를 바탕으로 학생의 질문에 답하세요.`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  return { solution: response.content as string };
}

// ── 과목별 풀이 (공통 빌더) ───────────────────────────────────────────────────

function buildSolverMessages(state: GraphState, subjectSystem: string): BaseMessage[] {
  const messages: BaseMessage[] = [
    new SystemMessage(`${SYSTEM_PROMPT}\n\n${subjectSystem}`),
  ];

  for (const entry of state.conversationHistory.slice(-10)) {
    if (entry.sender === 'student') {
      messages.push(new HumanMessage(entry.content));
    } else {
      messages.push(new AIMessage(entry.content));
    }
  }

  const multiNote =
    state.problemCount > 1
      ? '이미지에 문제가 여러 개 있습니다. 첫 번째 문제만 풀어주세요.\n\n'
      : '';
  const userNote = state.userMessage ? `\n\n학생 질문: ${state.userMessage}` : '';

  if (state.image) {
    messages.push(
      new HumanMessage({
        content: [
          { type: 'text', text: `${multiNote}${userNote}`.trim() || '이 문제를 풀어주세요.' },
          { type: 'image_url', image_url: { url: buildImageUrl(state.image, state.mimeType) } },
        ],
      }),
    );
  } else {
    messages.push(new HumanMessage(`${multiNote}${state.userMessage ?? ''}`));
  }

  return messages;
}

function createSubjectSolver(subjectSystem: string, temperature: number, maxTokens: number) {
  return async function (state: GraphState): Promise<Partial<GraphState>> {
    const model = new ChatOpenAI({
      model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
      temperature,
      maxTokens,
    });
    const messages = buildSolverMessages(state, subjectSystem);
    const response = await model.invoke(messages);
    return { solution: response.content as string };
  };
}

const solveMath = createSubjectSolver(MATH_SYSTEM, 0.2, 4096);
const solveKorean = createSubjectSolver(KOREAN_SYSTEM, 0.4, 3000);
const solveEnglish = createSubjectSolver(ENGLISH_SYSTEM, 0.3, 3000);
const solveScience = createSubjectSolver(SCIENCE_SYSTEM, 0.2, 4096);
const solveSocial = createSubjectSolver(SOCIAL_SYSTEM, 0.4, 3000);

// ── 풀이 검증 ─────────────────────────────────────────────────────────────────

async function verifySolution(state: GraphState): Promise<Partial<GraphState>> {
  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 200,
    temperature: 0,
  });

  const response = await model.invoke([
    new HumanMessage(`${VERIFY_SOLUTION_PROMPT}${state.solution}`),
  ]);

  const parsed = parseJson<{ confidence?: string; issues?: string[] }>(
    response.content as string,
    { confidence: 'high', issues: [] },
  );

  const confidence = (['high', 'medium', 'low'].includes(parsed.confidence ?? '')
    ? parsed.confidence
    : 'high') as 'high' | 'medium' | 'low';

  const issues = parsed.issues ?? [];
  let warningMessage = '';

  if (confidence === 'low') {
    warningMessage = `⚠️ 이 풀이는 정확하지 않을 수 있습니다. 검증 결과: ${issues.join(', ')}`;
  } else if (confidence === 'medium' && issues.length > 0) {
    warningMessage = `💡 일부 과정에 확인이 필요합니다: ${issues.join(', ')}`;
  }

  return { confidence, warningMessage };
}

// ── 캐시 저장 (클로저) ────────────────────────────────────────────────────────

function createSaveCache(cacheRepo: Repository<SolutionCache>) {
  return async function (state: GraphState): Promise<Partial<GraphState>> {
    // exam_id가 없거나 이미 캐시 히트였으면 스킵
    if (!state.examId || !state.questionNo || state.cacheHit) return {};

    await cacheRepo.upsert(
      {
        exam_id: state.examId,
        question_no: state.questionNo,
        subject: state.subject,
        solution_text: state.solution,
        concept_tags: state.conceptTags,
        answer: extractAnswer(state.solution),
        confidence: state.confidence,
      },
      ['exam_id', 'question_no'],
    );

    return {};
  };
}

// ── 응답 파싱 ─────────────────────────────────────────────────────────────────

function parseResponse(state: GraphState): Partial<GraphState> {
  const text = state.solution;
  const conceptTags: string[] = [];

  const tagSection = text.match(/##\s*태그([\s\S]*?)(?=##|$)/);
  if (tagSection) {
    const lines = tagSection[1].split('\n').filter((l) => l.trim().startsWith('-'));
    for (const line of lines) {
      const value = line.replace(/^-\s*[^:]+:\s*/, '').trim();
      if (value) conceptTags.push(value);
    }
  }

  const finalSolution = state.warningMessage
    ? `${text}\n\n${state.warningMessage}`
    : text;

  return { solution: finalSolution, conceptTags };
}

// ── 그래프 조립 ───────────────────────────────────────────────────────────────

export function buildChatGraph(cacheRepo: Repository<SolutionCache>) {
  const checkCache = createCheckCache(cacheRepo);
  const saveCache = createSaveCache(cacheRepo);

  const graph = new StateGraph(GraphAnnotation)
    .addNode('validateImage', validateImage)
    .addNode('returnError', returnError)
    .addNode('detectProblems', detectProblems)
    .addNode('classifySubject', classifySubject)
    .addNode('identifyQuestion', identifyQuestion)
    .addNode('checkCache', checkCache)
    .addNode('answerFromCache', answerFromCache)
    .addNode('solveMath', solveMath)
    .addNode('solveKorean', solveKorean)
    .addNode('solveEnglish', solveEnglish)
    .addNode('solveScience', solveScience)
    .addNode('solveSocial', solveSocial)
    .addNode('verifySolution', verifySolution)
    .addNode('saveCache', saveCache)
    .addNode('parseResponse', parseResponse)

    .addEdge(START, 'validateImage')

    .addConditionalEdges('validateImage', (state) => {
      if (!state.isValid) return 'returnError';
      if (!state.image) return 'classifySubject';
      return 'detectProblems';
    })

    .addEdge('returnError', END)
    .addEdge('detectProblems', 'classifySubject')
    .addEdge('classifySubject', 'identifyQuestion')
    .addEdge('identifyQuestion', 'checkCache')

    .addConditionalEdges('checkCache', (state) => {
      if (state.cacheHit && !state.userMessage) return 'parseResponse';
      if (state.cacheHit && state.userMessage) return 'answerFromCache';
      switch (state.subject) {
        case '수학': return 'solveMath';
        case '국어': return 'solveKorean';
        case '영어': return 'solveEnglish';
        case '과학': return 'solveScience';
        case '사회': return 'solveSocial';
        default:     return 'solveMath';
      }
    })

    .addEdge('answerFromCache', 'parseResponse')
    .addEdge('solveMath', 'verifySolution')
    .addEdge('solveKorean', 'verifySolution')
    .addEdge('solveEnglish', 'verifySolution')
    .addEdge('solveScience', 'verifySolution')
    .addEdge('solveSocial', 'verifySolution')
    .addEdge('verifySolution', 'saveCache')
    .addEdge('saveCache', 'parseResponse')
    .addEdge('parseResponse', END);

  return graph.compile();
}
