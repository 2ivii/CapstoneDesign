import { createBrowserRouter } from "react-router";
import { ScoreRegistration } from "./pages/ScoreRegistration";
import { AnswerMarking } from "./pages/AnswerMarking";
import { WeaknessAnalysis } from "./pages/WeaknessAnalysis";
import { AIPlanner } from "./pages/AIPlanner";
import { AIChatbot } from "./pages/AIChatbot";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ScoreRegistration,
  },
  {
    path: "/answer-marking",
    Component: AnswerMarking,
  },
  {
    path: "/analysis",
    Component: WeaknessAnalysis,
  },
  {
    path: "/ai-planner",
    Component: AIPlanner,
  },
  {
    path: "/ai-chatbot",
    Component: AIChatbot,
  },
]);
