import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  SYSTEM_PROMPT,
  SUBJECT_PROMPTS,
  CLASSIFY_PROMPT,
} from './prompts/solver.prompt';

const GraphAnnotation = Annotation.Root({
  image: Annotation<string>({ reducer: (_, next) => next }),
  mimeType: Annotation<string>({ reducer: (_, next) => next }),
  subject: Annotation<string>({ reducer: (_, next) => next, default: () => '' }),
  userMessage: Annotation<string | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
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
  if (state.subject) return {};

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

  const subjectHint = SUBJECT_PROMPTS[state.subject] ?? '';
  const userNote = state.userMessage ? `\n\n학생 질문: ${state.userMessage}` : '';

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage({
      content: [
        {
          type: 'text',
          text: `${subjectHint}${userNote}`,
        },
        {
          type: 'image_url',
          image_url: { url: buildImageUrl(state.image, state.mimeType) },
        },
      ],
    }),
  ]);

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
