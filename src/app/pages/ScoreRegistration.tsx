import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { AutoGrading } from "../components/AutoGrading";
import { Camera, Upload, Check, Edit3 } from "lucide-react";

export function ScoreRegistration() {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState<"photo" | "manual">("photo");
  const [scores, setScores] = useState({
    korean: { total: "85", score: "91", grade: "2" },
    math: { total: "75", score: "82", grade: "3" },
    english: { total: "95", score: "98", grade: "1" },
    science: { total: "43", score: "90", grade: "2" },
    science2: { total: "42", score: "89", grade: "2" },
    history: { total: "44", score: "92", grade: "2" },
  });

  // 자동채점 과목 정의
  const gradingSubjects = [
    {
      id: "korean",
      name: "국어",
      total: 45,
      correctAnswers: ["1", "2", "1", "3", "1", "1", "1", "4", "2", "5", "2", "4", "2", "4", "1", "2", "2", "4", "2", "4", "2", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "2", "4", "1"],
    },
    {
      id: "math",
      name: "수학",
      total: 30,
      correctAnswers: ["3", "4", "2", "5", "1", "3", "2", "4", "1", "5", "2", "4", "3", "1", "4", "2", "5", "3", "1", "4", "2", "5", "3", "4", "1", "2", "5", "3", "4", "1"],
    },
    {
      id: "english",
      name: "영어",
      total: 45,
      correctAnswers: ["1", "2", "1", "3", "1", "1", "1", "4", "2", "5", "2", "4", "2", "4", "1", "2", "2", "4", "2", "4", "2", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "2", "4", "1"],
    },
    {
      id: "science1",
      name: "생명과학1",
      total: 20,
      correctAnswers: ["2", "4", "1", "3", "2", "4", "1", "3", "2", "5", "1", "4", "3", "2", "5", "1", "3", "4", "2", "1"],
    },
    {
      id: "science2",
      name: "지구과학1",
      total: 20,
      correctAnswers: ["3", "1", "4", "2", "5", "3", "1", "4", "2", "3", "5", "1", "4", "2", "3", "1", "5", "4", "2", "3"],
    },
    {
      id: "history",
      name: "한국사",
      total: 20,
      correctAnswers: ["4", "2", "3", "1", "5", "2", "4", "1", "3", "2", "4", "5", "1", "3", "2", "4", "1", "5", "3", "2"],
    },
  ];

  const handleAutoGradingComplete = (results: Record<string, { score: number; total: number; grade: string; wrongQuestions: number[] }>) => {
    // 자동채점 결과를 scores 상태에 반영
    const newScores: any = {};
    Object.keys(results).forEach((subjectId) => {
      newScores[subjectId] = {
        total: results[subjectId].total.toString(),
        score: results[subjectId].score.toString(),
        grade: results[subjectId].grade,
      };
    });
    setScores(newScores);
    setInputMethod("photo"); // 결과 확인을 위해 photo 탭으로 이동
  };

  const subjects = [
    { id: "korean", name: "국어 (언어와 매체)", data: scores.korean },
    { id: "math", name: "수학 (미적분)", data: scores.math },
    { id: "english", name: "영어", data: scores.english },
    { id: "science1", name: "생명과학1", data: scores.science },
    { id: "science2", name: "지구과학1", data: scores.science2 },
    { id: "history", name: "한국사", data: scores.history },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              모의고사 성적표 촬영 및 점수 데이터 보정
            </h1>
            <p className="text-gray-600">2026.05.27 19:09</p>
          </div>

          {/* Input Method Selection */}
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "photo" | "manual")} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                성적표 촬영
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                수기입력 (자동채점)
              </TabsTrigger>
            </TabsList>

            {/* Photo Upload Method */}
            <TabsContent value="photo" className="mt-6">
              <div className="grid grid-cols-2 gap-8">
            {/* Left: Upload Area */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
              <h2 className="text-lg font-semibold mb-6">성적표 촬영 또는 스캔</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      성적표 업로드 또는 직접 촬영
                    </p>
                    <p className="text-sm text-gray-500">
                      사진을 드래그하거나 클릭하여 업로드하세요
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    스마트폰으로 성적표를 촬영한 사진 또는 스캔본을 업로드하세요.<br />
                    명확하게 보일수록 정확도가 높아집니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  다시 촬영
                </Button>
                <Button variant="outline" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  갤러리 선택
                </Button>
              </div>
            </div>

            {/* Right: Score Table */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">자동 인식 결과</h2>
                <span className="text-sm text-emerald-600 font-medium">정확도: 98.2%</span>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                성적표 이미지를 바탕으로 자동 분석한 점수를 확인하고 수정할 수 있습니다. 각 과목별로 틀린 문항을 다음 단계에서 표시할 수 있습니다.
              </p>

              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                  <div>과목</div>
                  <div className="text-center">원점수</div>
                  <div className="text-center">백분위</div>
                  <div className="text-center">등급</div>
                </div>

                {/* Table Rows */}
                {subjects.map((subject) => (
                  <div key={subject.id} className="grid grid-cols-4 gap-4 items-center">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{subject.name}</span>
                    </div>
                    <div className="text-center">
                      <Input
                        value={subject.data.total}
                        className="text-center h-9"
                        placeholder="---"
                      />
                    </div>
                    <div className="text-center">
                      <Input
                        value={subject.data.score}
                        className="text-center h-9"
                        placeholder="---"
                      />
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-full h-9 bg-gray-50 rounded-md font-medium">
                        {subject.data.grade ? `${subject.data.grade}등급` : "---"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </TabsContent>

            {/* Manual Input Method with Auto Grading */}
            <TabsContent value="manual" className="mt-6">
              <AutoGrading subjects={gradingSubjects} onComplete={handleAutoGradingComplete} />
            </TabsContent>
          </Tabs>

          {/* Bottom Button */}
          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              onClick={() => navigate("/answer-marking")}
            >
              다음 - 오답 문항 입력 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

