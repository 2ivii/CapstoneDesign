import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

type Subject = "korean" | "math" | "english" | "science1" | "science2" | "history";

export function AnswerMarking() {
  const navigate = useNavigate();
  const [wrongAnswers, setWrongAnswers] = useState<Record<Subject, Set<number>>>({
    korean: new Set([13, 22]),
    math: new Set([14, 21, 22, 29, 30]),
    english: new Set([31, 33, 34]),
    science1: new Set([15, 17]),
    science2: new Set(),
    history: new Set(),
  });

  const subjects = [
    { id: "korean" as Subject, label: "국어", total: 45 },
    { id: "math" as Subject, label: "수학", total: 30 },
    { id: "english" as Subject, label: "영어", total: 45 },
    { id: "science1" as Subject, label: "생명과학1", total: 20 },
    { id: "science2" as Subject, label: "지구과학1", total: 20 },
    { id: "history" as Subject, label: "한국사", total: 20 },
  ];

  const toggleAnswer = (subject: Subject, number: number) => {
    setWrongAnswers((prev) => {
      const newSet = new Set(prev[subject]);
      if (newSet.has(number)) {
        newSet.delete(number);
      } else {
        newSet.add(number);
      }
      return { ...prev, [subject]: newSet };
    });
  };

  const getTotalWrongAnswers = () => {
    return Array.from(Object.values(wrongAnswers)).reduce(
      (sum, set) => sum + set.size,
      0
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 단계 (성적표 입력)
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  틀린 문항 1차 오답 정밀 마킹
                </h1>
                <p className="text-gray-600">
                  각 과목별로 틀린 문제 번호를 선택하세요. 선택된 문항은 AI가 자동으로 분석합니다.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">총 선택된 오답</p>
                <p className="text-3xl font-bold text-rose-600">
                  {getTotalWrongAnswers()}개
                </p>
              </div>
            </div>
          </div>

          {/* All Subjects in Horizontal Scroll */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200 flex-shrink-0 w-[280px]"
                >
                  {/* Subject Header */}
                  <div className="mb-4 pb-3 border-b">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{subject.label}</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                        {wrongAnswers[subject.id].size}개 선택
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">({subject.total}문항)</p>
                  </div>

                  {/* Question Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: subject.total }, (_, i) => i + 1).map((num) => {
                      const isWrong = wrongAnswers[subject.id].has(num);
                      return (
                        <button
                          key={num}
                          onClick={() => toggleAnswer(subject.id, num)}
                          className={`h-10 rounded-lg text-sm font-medium transition-all ${
                            isWrong
                              ? "bg-rose-500 text-white shadow-md hover:bg-rose-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear Button */}
                  <button
                    className="w-full mt-4 pt-3 border-t text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setWrongAnswers((prev) => ({
                        ...prev,
                        [subject.id]: new Set(),
                      }));
                    }}
                  >
                    전체 해제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-end">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
              >
                ← 이전 단계 (점수 입력)
              </Button>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                onClick={() => navigate("/analysis")}
              >
                AI 기반 오답 문항 분석 시작 →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
