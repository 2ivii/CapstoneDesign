import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";

interface Answer {
  [key: number]: string;
}

interface SubjectGradingProps {
  subjectName: string;
  totalQuestions: number;
  correctAnswers: string[];
  onScoreCalculated: (score: number, wrongQuestions: number[]) => void;
}

export function AutoGrading({
  subjects,
  onComplete,
}: {
  subjects: Array<{
    id: string;
    name: string;
    total: number;
    correctAnswers: string[];
  }>;
  onComplete: (results: Record<string, { score: number; total: number; grade: string; wrongQuestions: number[] }>) => void;
}) {
  const [activeSubject, setActiveSubject] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<string, Answer>>({});
  const [results, setResults] = useState<Record<string, { score: number; wrongQuestions: number[] }>>({});

  const currentSubject = subjects[activeSubject];

  const handleAnswerChange = (questionNum: number, answer: string) => {
    setAllAnswers((prev) => ({
      ...prev,
      [currentSubject.id]: {
        ...(prev[currentSubject.id] || {}),
        [questionNum]: answer.toUpperCase(),
      },
    }));
  };

  const calculateScore = () => {
    const userAnswers = allAnswers[currentSubject.id] || {};
    let correctCount = 0;
    const wrongQuestions: number[] = [];

    currentSubject.correctAnswers.forEach((correctAnswer, index) => {
      const questionNum = index + 1;
      const userAnswer = userAnswers[questionNum];

      if (userAnswer === correctAnswer) {
        correctCount++;
      } else if (userAnswer) {
        wrongQuestions.push(questionNum);
      }
    });

    const score = Math.round((correctCount / currentSubject.total) * 100);

    setResults((prev) => ({
      ...prev,
      [currentSubject.id]: { score, wrongQuestions },
    }));

    // Move to next subject or complete
    if (activeSubject < subjects.length - 1) {
      setActiveSubject(activeSubject + 1);
    }
  };

  const handleComplete = () => {
    const finalResults: Record<string, { score: number; total: number; grade: string; wrongQuestions: number[] }> = {};

    subjects.forEach((subject) => {
      const result = results[subject.id] || { score: 0, wrongQuestions: [] };
      const grade = getGrade(result.score);
      finalResults[subject.id] = {
        score: result.score,
        total: subject.total,
        grade,
        wrongQuestions: result.wrongQuestions,
      };
    });

    onComplete(finalResults);
  };

  const getGrade = (score: number): string => {
    if (score >= 90) return "1";
    if (score >= 80) return "2";
    if (score >= 70) return "3";
    if (score >= 60) return "4";
    return "5";
  };

  const userAnswers = allAnswers[currentSubject.id] || {};
  const answeredCount = Object.keys(userAnswers).filter((key) => userAnswers[parseInt(key)]).length;
  const isSubjectComplete = answeredCount === currentSubject.total;
  const hasResult = results[currentSubject.id];

  return (
    <div className="space-y-6">
      {/* Subject Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {subjects.map((subject, index) => (
          <button
            key={subject.id}
            onClick={() => setActiveSubject(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSubject === index
                ? "bg-emerald-600 text-white"
                : results[subject.id]
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {subject.name}
            {results[subject.id] && (
              <Check className="inline-block w-4 h-4 ml-2" />
            )}
          </button>
        ))}
      </div>

      {/* Current Subject */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentSubject.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              가채점 답안을 입력하세요 (1~5번)
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">입력 진행률</p>
            <p className="text-2xl font-bold text-emerald-600">
              {answeredCount} / {currentSubject.total}
            </p>
          </div>
        </div>

        {hasResult && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">채점 완료</p>
                <p className="text-xs text-emerald-600 mt-1">
                  틀린 문항: {results[currentSubject.id].wrongQuestions.length}개
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-700">
                  {results[currentSubject.id].score}점
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Answer Grid */}
        <div className="grid grid-cols-10 gap-3">
          {Array.from({ length: currentSubject.total }, (_, i) => i + 1).map((num) => {
            const userAnswer = userAnswers[num];
            const correctAnswer = currentSubject.correctAnswers[num - 1];
            const isCorrect = hasResult && userAnswer === correctAnswer;
            const isWrong = hasResult && userAnswer && userAnswer !== correctAnswer;

            return (
              <div key={num} className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1 text-center font-medium">
                  {num}번
                </label>
                <Input
                  value={userAnswer || ""}
                  onChange={(e) => handleAnswerChange(num, e.target.value)}
                  maxLength={1}
                  className={`text-center h-12 text-lg font-bold uppercase ${
                    isCorrect
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : isWrong
                      ? "bg-rose-50 border-rose-500 text-rose-700"
                      : ""
                  }`}
                  placeholder="?"
                  disabled={hasResult}
                />
                {hasResult && (
                  <div className="text-center mt-1">
                    {isCorrect ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : isWrong ? (
                      <X className="w-4 h-4 text-rose-600 mx-auto" />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setAllAnswers((prev) => ({
                ...prev,
                [currentSubject.id]: {},
              }));
              setResults((prev) => {
                const newResults = { ...prev };
                delete newResults[currentSubject.id];
                return newResults;
              });
            }}
          >
            입력 초기화
          </Button>

          {!hasResult ? (
            <Button
              onClick={calculateScore}
              disabled={!isSubjectComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              채점하기 ({answeredCount}/{currentSubject.total})
            </Button>
          ) : (
            <div className="flex gap-3">
              {activeSubject < subjects.length - 1 ? (
                <Button
                  onClick={() => setActiveSubject(activeSubject + 1)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  다음 과목 →
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  채점 완료
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
