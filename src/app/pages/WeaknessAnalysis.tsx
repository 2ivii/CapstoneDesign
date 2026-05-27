import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingDown, TrendingUp, BookOpen, Target, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

export function WeaknessAnalysis() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState("korean");

  const subjects = [
    { id: "korean", name: "국어", color: "#10b981" },
    { id: "math", name: "수학", color: "#3b82f6" },
    { id: "english", name: "영어", color: "#8b5cf6" },
    { id: "science1", name: "생명과학1", color: "#f59e0b" },
    { id: "science2", name: "지구과학1", color: "#06b6d4" },
    { id: "history", name: "한국사", color: "#ec4899" },
  ];

  const analysisData = {
    korean: {
      overallAccuracy: 78,
      grade: "2등급",
      trend: "up",
      unitAccuracy: [
        { unit: "문학", accuracy: 85, total: 15, correct: 13 },
        { unit: "독서", accuracy: 72, total: 20, correct: 14 },
        { unit: "언어와 매체", accuracy: 75, total: 10, correct: 7 },
      ],
      weakConcepts: [
        { concept: "고전소설 주제 파악", wrongCount: 4, difficulty: "상" },
        { concept: "비문학 추론 문제", wrongCount: 6, difficulty: "상" },
        { concept: "문법 - 음운 변동", wrongCount: 3, difficulty: "중" },
      ],
      recentScores: [
        { exam: "3월", score: 72, grade: 3 },
        { exam: "4월", score: 76, grade: 2 },
        { exam: "5월", score: 78, grade: 2 },
      ],
    },
    math: {
      overallAccuracy: 65,
      grade: "3등급",
      trend: "down",
      unitAccuracy: [
        { unit: "수열", accuracy: 55, total: 8, correct: 4 },
        { unit: "미분", accuracy: 70, total: 10, correct: 7 },
        { unit: "적분", accuracy: 68, total: 7, correct: 5 },
        { unit: "기하", accuracy: 60, total: 5, correct: 3 },
      ],
      weakConcepts: [
        { concept: "수열의 극한 응용", wrongCount: 5, difficulty: "상" },
        { concept: "적분을 이용한 넓이", wrongCount: 4, difficulty: "상" },
        { concept: "도함수 활용", wrongCount: 3, difficulty: "중" },
      ],
      recentScores: [
        { exam: "3월", score: 70, grade: 2 },
        { exam: "4월", score: 68, grade: 3 },
        { exam: "5월", score: 65, grade: 3 },
      ],
    },
    english: {
      overallAccuracy: 88,
      grade: "1등급",
      trend: "up",
      unitAccuracy: [
        { unit: "듣기", accuracy: 95, total: 17, correct: 16 },
        { unit: "독해 - 주제/제목", accuracy: 85, total: 10, correct: 8 },
        { unit: "독해 - 빈칸", accuracy: 80, total: 8, correct: 6 },
        { unit: "독해 - 순서/삽입", accuracy: 90, total: 10, correct: 9 },
      ],
      weakConcepts: [
        { concept: "빈칸 추론 (고난도)", wrongCount: 2, difficulty: "상" },
        { concept: "장문 독해", wrongCount: 2, difficulty: "중" },
        { concept: "어법 판단", wrongCount: 1, difficulty: "중" },
      ],
      recentScores: [
        { exam: "3월", score: 84, grade: 1 },
        { exam: "4월", score: 86, grade: 1 },
        { exam: "5월", score: 88, grade: 1 },
      ],
    },
    science1: {
      overallAccuracy: 75,
      grade: "2등급",
      trend: "up",
      unitAccuracy: [
        { unit: "생명과학의 이해", accuracy: 90, total: 3, correct: 3 },
        { unit: "세포와 생명의 연속성", accuracy: 70, total: 6, correct: 4 },
        { unit: "항상성과 몸의 조절", accuracy: 65, total: 7, correct: 5 },
        { unit: "유전", accuracy: 80, total: 4, correct: 3 },
      ],
      weakConcepts: [
        { concept: "호르몬과 항상성", wrongCount: 3, difficulty: "상" },
        { concept: "유전자 발현", wrongCount: 2, difficulty: "상" },
        { concept: "신경계", wrongCount: 2, difficulty: "중" },
      ],
      recentScores: [
        { exam: "3월", score: 70, grade: 3 },
        { exam: "4월", score: 73, grade: 2 },
        { exam: "5월", score: 75, grade: 2 },
      ],
    },
    science2: {
      overallAccuracy: 70,
      grade: "2등급",
      trend: "down",
      unitAccuracy: [
        { unit: "고체 지구", accuracy: 75, total: 6, correct: 4 },
        { unit: "대기와 해양", accuracy: 65, total: 7, correct: 5 },
        { unit: "우주", accuracy: 72, total: 7, correct: 5 },
      ],
      weakConcepts: [
        { concept: "판 구조론", wrongCount: 3, difficulty: "상" },
        { concept: "기압과 날씨", wrongCount: 4, difficulty: "중" },
        { concept: "별의 특성", wrongCount: 2, difficulty: "중" },
      ],
      recentScores: [
        { exam: "3월", score: 75, grade: 2 },
        { exam: "4월", score: 72, grade: 2 },
        { exam: "5월", score: 70, grade: 2 },
      ],
    },
    history: {
      overallAccuracy: 82,
      grade: "2등급",
      trend: "up",
      unitAccuracy: [
        { unit: "선사 시대와 고대", accuracy: 85, total: 5, correct: 4 },
        { unit: "고려의 성립과 발전", accuracy: 80, total: 5, correct: 4 },
        { unit: "조선의 건국과 발전", accuracy: 78, total: 5, correct: 4 },
        { unit: "근현대사", accuracy: 88, total: 5, correct: 4 },
      ],
      weakConcepts: [
        { concept: "고대 국가의 발전", wrongCount: 2, difficulty: "중" },
        { concept: "조선 시대 정치 제도", wrongCount: 1, difficulty: "중" },
        { concept: "근대 개화기", wrongCount: 1, difficulty: "하" },
      ],
      recentScores: [
        { exam: "3월", score: 78, grade: 2 },
        { exam: "4월", score: 80, grade: 2 },
        { exam: "5월", score: 82, grade: 2 },
      ],
    },
  };

  const currentData = analysisData[selectedSubject as keyof typeof analysisData];
  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/answer-marking")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 단계 (틀린 문항 체크)
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">과목별 약점 분석</h1>
            <p className="text-gray-600">최근 3회 모의고사 기록을 바탕으로 분석한 과목별 취약점입니다</p>
          </div>

          {/* Subject Tabs */}
          <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="mb-6">
            <TabsList className="grid w-full grid-cols-6 h-auto">
              {subjects.map((subject) => (
                <TabsTrigger
                  key={subject.id}
                  value={subject.id}
                  className="py-3 data-[state=active]:bg-white"
                  style={{
                    borderBottom: selectedSubject === subject.id ? `3px solid ${subject.color}` : "none",
                  }}
                >
                  <span className="font-medium">{subject.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((subject) => (
              <TabsContent key={subject.id} value={subject.id} className="mt-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">전체 정답률</p>
                          <p className="text-2xl font-bold" style={{ color: currentSubject?.color }}>
                            {currentData.overallAccuracy}%
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">현재 등급</p>
                          <p className="text-2xl font-bold text-gray-900">{currentData.grade}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">최근 추세</p>
                          <div className="flex items-center gap-2">
                            {currentData.trend === "up" ? (
                              <>
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                <span className="text-lg font-bold text-emerald-600">상승</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                <span className="text-lg font-bold text-red-600">하락</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">취약 개념 수</p>
                          <p className="text-2xl font-bold text-amber-600">
                            {currentData.weakConcepts.length}개
                          </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Unit Accuracy */}
                  <Card>
                    <CardHeader>
                      <CardTitle>단원별 정답률</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={currentData.unitAccuracy}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="unit" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{data.unit}</p>
                                    <p className="text-sm text-gray-600">
                                      정답률: {data.accuracy}%
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      맞힌 문제: {data.correct}/{data.total}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="accuracy" fill={currentSubject?.color} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Recent Score Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>최근 3회 성적 추이</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={currentData.recentScores}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="exam" />
                          <YAxis yAxisId="left" domain={[0, 100]} />
                          <YAxis yAxisId="right" orientation="right" domain={[1, 9]} reversed />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-semibold">{data.exam}월 모의고사</p>
                                    <p className="text-sm text-gray-600">점수: {data.score}점</p>
                                    <p className="text-sm text-gray-600">등급: {data.grade}등급</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="score"
                            stroke={currentSubject?.color}
                            strokeWidth={2}
                            name="점수"
                            dot={{ fill: currentSubject?.color, r: 5 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="grade"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="등급"
                            dot={{ fill: "#94a3b8", r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Weak Concepts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      취약 개념 및 유형
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentData.weakConcepts.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{item.concept}</h3>
                              <Badge
                                variant={
                                  item.difficulty === "상"
                                    ? "destructive"
                                    : item.difficulty === "중"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                난이도 {item.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              최근 3회 모의고사에서 총 {item.wrongCount}문제 오답
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-red-600">{item.wrongCount}</p>
                            <p className="text-xs text-gray-500">오답 문항</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Unit Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>단원별 상세 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentData.unitAccuracy.map((unit, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{unit.unit}</span>
                            <span className="text-sm text-gray-600">
                              {unit.correct}/{unit.total} ({unit.accuracy}%)
                            </span>
                          </div>
                          <Progress value={unit.accuracy} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" size="lg" onClick={() => navigate("/answer-marking")}>
              ← 이전 단계 (틀린 문항 체크)
            </Button>
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              onClick={() => navigate("/ai-planner")}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI 학습 플래너 생성 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
