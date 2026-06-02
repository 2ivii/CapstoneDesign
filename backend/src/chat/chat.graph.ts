import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import {
  SYSTEM_PROMPT,
  SUBJECT_PROMPTS,
  CLASSIFY_PROMPT,
} from './prompts/solver.prompt';

export interface ConversationEntry {
  sender: string;
  content: string;
}

const GraphAnnotation = Annotation.Root({
  image: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
  mimeType: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
  subject: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
  userMessage: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  conversationHistory: Annotation<ConversationEntry[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  solution: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
  conceptTags: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
});

type GraphState = typeof GraphAnnotation.State;

function buildImageUrl(image: string, mimeType: string): string {
  return `data:${mimeType};base64,${image}`;
}

async function classifySubject(state: GraphState): Promise<Partial<GraphState>> {
  // Skip if subject already known, or if no image (followup text-only)
  if (state.subject || !state.image) return {};

  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: 20,
  });

  const response = await model.invoke([
    new HumanMessage({
      content: [
        { type: 'text', text: CLASSIFY_PROMPT },
        {
          type: 'image_url',
          image_url: { url: buildImageUrl(state.image, state.mimeType) },
        },
      ],
    }),
  ]);

  const raw = (response.content as string).trim();
  const known = Object.keys(SUBJECT_PROMPTS);
  const subject = known.find((s) => raw.includes(s)) ?? '기타';
  return { subject };
}

async function solve(state: GraphState): Promise<Partial<GraphState>> {
  const model = new ChatOpenAI({
    model: process.env.CHAT_MODEL ?? 'gpt-4o-mini',
    maxTokens: Number(process.env.CHAT_MAX_TOKENS ?? 4096),
  });

  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT)];

  // Append conversation history (최근 10개)
  const history = state.conversationHistory.slice(-10);
  for (const entry of history) {
    if (entry.sender === 'student') {
      messages.push(new HumanMessage(entry.content));
    } else {
      messages.push(new AIMessage(entry.content));
    }
  }

  const subjectHint = SUBJECT_PROMPTS[state.subject] ?? '';
  const userNote = state.userMessage ? `\n\n학생 질문: ${state.userMessage}` : '';

  if (state.image) {
    // 이미지 기반 풀이
    messages.push(
      new HumanMessage({
        content: [
          { type: 'text', text: `${subjectHint}${userNote}` },
          {
            type: 'image_url',
            image_url: { url: buildImageUrl(state.image, state.mimeType) },
          },
        ],
      }),
    );
  } else {
    // 텍스트 전용 후속 질문
    messages.push(new HumanMessage(state.userMessage ?? ''));
  }

  const response = await model.invoke(messages);
  return { solution: response.content as string };
}

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

  return { conceptTags };
}

export function buildChatGraph() {
  const graph = new StateGraph(GraphAnnotation)
    .addNode('classifySubject', classifySubject)
    .addNode('solve', solve)
    .addNode('parseResponse', parseResponse)
    .addEdge(START, 'classifySubject')
    .addEdge('classifySubject', 'solve')
    .addEdge('solve', 'parseResponse')
    .addEdge('parseResponse', END);

  return graph.compile();
}
