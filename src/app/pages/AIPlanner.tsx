import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { ArrowLeft, Clock, Target, AlertCircle, Sparkles, TrendingUp, CheckCircle } from "lucide-react";

export function AIPlanner() {
  const navigate = useNavigate();

  // 과목 정의 및 색상
  const subjects = {
    math: { name: "수학", color: "#10b981", bgColor: "#d1fae5", textColor: "#065f46" },
    korean: { name: "국어", color: "#f59e0b", bgColor: "#fef3c7", textColor: "#92400e" },
    english: { name: "영어", color: "#3b82f6", bgColor: "#dbeafe", textColor: "#1e40af" },
    science1: { name: "생명과학1", color: "#8b5cf6", bgColor: "#ede9fe", textColor: "#5b21b6" },
    rest: { name: "휴식", color: "#9ca3af", bgColor: "#f3f4f6", textColor: "#4b5563" },
  };

  // 과목 우선순위 (약점 분석 기반)
  const subjectPriority = [
    {
      subject: "수학",
      current: 3,
      target: 1,
      priority: "urgent",
      gap: 2,
      weakUnits: ["수열의 극한", "적분"],
      percentage: 34,
      color: subjects.math.color,
    },
    {
      subject: "국어",
      current: 2,
      target: 1,
      priority: "high",
      gap: 1,
      weakUnits: ["비문학 추론", "고전소설"],
      percentage: 24,
      color: subjects.korean.color,
    },
    {
      subject: "영어",
      current: 1,
      target: 1,
      priority: "medium",
      gap: 0,
      weakUnits: ["빈칸 추론"],
      percentage: 22,
      color: subjects.english.color,
    },
    {
      subject: "생명과학1",
      current: 2,
      target: 1,
      priority: "high",
      gap: 1,
      weakUnits: ["호르몬과 항상성", "유전자 발현"],
      percentage: 20,
      color: subjects.science1.color,
    },
  ];

  // 시간대 (한 화면에 표시하기 위해 2시간 단위로 축약)
  const timeSlots = [
    "06시", "08시", "10시", "12시", "14시", "16시", "18시", "20시", "22시"
  ];

  // 요일별 시간표 (rowSpan 형태로 블록 정의)
  type ScheduleBlock = {
    subject: keyof typeof subjects;
    topic: string;
    startRow: number;
    rowSpan: number;
    concentration: number;
  };

  const weekSchedule: Record<string, ScheduleBlock[]> = {
    mon: [
      { subject: "math", topic: "미적분", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "korean", topic: "문학", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "rest", topic: "휴식", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "english", topic: "독해", startRow: 4, rowSpan: 1, concentration: 65 },
      { subject: "science1", topic: "유전", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "math", topic: "적분 심화", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "science1", topic: "항상성", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    tue: [
      { subject: "math", topic: "극한", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "korean", topic: "독서", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "korean", topic: "언어", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "english", topic: "문법", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "math", topic: "미분", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "english", topic: "빈칸 추론", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "science1", topic: "세포", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    wed: [
      { subject: "math", topic: "수열", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "english", topic: "독해", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "korean", topic: "문학", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "english", topic: "어휘", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "science1", topic: "호르몬", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "korean", topic: "비문학", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "math", topic: "미적분", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    thu: [
      { subject: "math", topic: "적분", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "science1", topic: "유전자", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "english", topic: "독해", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "korean", topic: "독서", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "english", topic: "빈칸", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "math", topic: "수열 심화", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "science1", topic: "신경계", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    fri: [
      { subject: "math", topic: "미적분", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "korean", topic: "문학", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "science1", topic: "항상성", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "english", topic: "독해", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "math", topic: "극한", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "korean", topic: "비문학", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "science1", topic: "세포 분열", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    sat: [
      { subject: "math", topic: "모의고사", startRow: 0, rowSpan: 1, concentration: 85 },
      { subject: "korean", topic: "모의고사", startRow: 1, rowSpan: 1, concentration: 75 },
      { subject: "english", topic: "모의고사", startRow: 2, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "science1", topic: "모의고사", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "math", topic: "오답정리", startRow: 7, rowSpan: 1, concentration: 90 },
      { subject: "korean", topic: "오답정리", startRow: 8, rowSpan: 1, concentration: 88 },
    ],
    sun: [
      { subject: "rest", topic: "휴식", startRow: 0, rowSpan: 1, concentration: 70 },
      { subject: "rest", topic: "휴식", startRow: 1, rowSpan: 1, concentration: 70 },
      { subject: "english", topic: "어휘 복습", startRow: 2, rowSpan: 1, concentration: 65 },
      { subject: "rest", topic: "점심", startRow: 3, rowSpan: 1, concentration: 45 },
      { subject: "rest", topic: "휴식", startRow: 4, rowSpan: 1, concentration: 60 },
      { subject: "math", topic: "약점 복습", startRow: 5, rowSpan: 1, concentration: 60 },
      { subject: "rest", topic: "휴식", startRow: 6, rowSpan: 1, concentration: 50 },
      { subject: "science1", topic: "개념 정리", startRow: 7, rowSpan: 1, concentration: 85 },
      { subject: "rest", topic: "휴식", startRow: 8, rowSpan: 1, concentration: 80 },
    ],
  };

  const days = [
    { key: "mon", label: "월" },
    { key: "tue", label: "화" },
    { key: "wed", label: "수" },
    { key: "thu", label: "목" },
    { key: "fri", label: "금" },
    { key: "sat", label: "토" },
    { key: "sun", label: "일" },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">긴급</Badge>;
      case "high":
        return <Badge className="bg-orange-500">높음</Badge>;
      case "medium":
        return <Badge variant="default">보통</Badge>;
      default:
        return <Badge variant="secondary">유지</Badge>;
    }
  };

  // 시간표 렌더링 헬퍼
  const renderScheduleCell = (dayKey: string, rowIndex: number) => {
    const schedule = weekSchedule[dayKey];
    const block = schedule.find((b) => b.startRow === rowIndex);

    if (block) {
      const subjectInfo = subjects[block.subject];
      const isHighConcentration = block.concentration >= 80;

      return (
        <td
          key={`${dayKey}-${rowIndex}`}
          rowSpan={block.rowSpan}
          className="border-0 p-1 relative"
        >
          <div
            className="h-full rounded-lg p-2 flex flex-col justify-center"
            style={{
              backgroundColor: subjectInfo.bgColor,
              color: subjectInfo.textColor,
            }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-xs">{subjectInfo.name}</span>
              {isHighConcentration && (
                <Sparkles className="w-3 h-3" style={{ color: subjectInfo.textColor, opacity: 0.7 }} />
              )}
            </div>
            <span className="text-xs opacity-80">{block.topic}</span>
          </div>
        </td>
      );
    }

    // 이미 rowSpan으로 처리된 셀은 렌더링하지 않음
    const isPartOfPreviousBlock = schedule.some(
      (b) => b.startRow < rowIndex && b.startRow + b.rowSpan > rowIndex
    );

    if (isPartOfPreviousBlock) {
      return null;
    }

    return <td key={`${dayKey}-${rowIndex}`} className="border-0 p-1 bg-transparent"></td>;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1800px] mx-auto p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/analysis")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 단계 (약점 분석)
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">AI 학습 플래너</h1>
            </div>
            <p className="text-gray-600">
              집중도 패턴과 과목별 약점을 분석하여 최적의 학습 시간표를 생성합니다
            </p>
          </div>

          {/* Timetable */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  주간 학습 시간표
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4" />
                  <span>집중도 높은 시간대 표시</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                집중도가 높은 시간대(새벽, 밤)에는 약점 과목을 배치했습니다
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "60px" }} />
                    {days.map((day) => (
                      <col key={day.key} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="bg-transparent p-2 text-xs font-semibold text-gray-700 text-center">
                        시간
                      </th>
                      {days.map((day) => (
                        <th
                          key={day.key}
                          className="bg-transparent p-2 text-xs font-semibold text-gray-700 text-center"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="bg-transparent p-1 text-center text-xs font-medium text-gray-500">
                          {time}
                        </td>
                        {days.map((day) => renderScheduleCell(day.key, rowIndex))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subjects.math.bgColor }}></div>
                  <span className="text-gray-600">{subjects.math.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subjects.korean.bgColor }}></div>
                  <span className="text-gray-600">{subjects.korean.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subjects.english.bgColor }}></div>
                  <span className="text-gray-600">{subjects.english.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subjects.science1.bgColor }}></div>
                  <span className="text-gray-600">{subjects.science1.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subjects.rest.bgColor }}></div>
                  <span className="text-gray-600">{subjects.rest.name}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">= 집중도 높은 시간대</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Section - 2 Columns */}
          <div className="grid grid-cols-2 gap-6">
            {/* Subject Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  과목별 우선순위
                </CardTitle>
                <p className="text-sm text-gray-600">약점 분석 기반 학습 우선순위</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectPriority.map((subject, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">{subject.subject}</span>
                          {getPriorityBadge(subject.priority)}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">현재 → 목표</p>
                          <p className="text-sm font-bold">
                            {subject.current}등급 → {subject.target}등급
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        취약 단원: {subject.weakUnits.join(", ")}
                      </div>

                      {subject.gap > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>등급 격차 {subject.gap}단계 - 집중 학습 필요</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  지능형 시간 가중치 산출
                </CardTitle>
                <p className="text-sm text-gray-600">
                  등급·진척 등급차 및 과목도 변별 차별 가능성을 복합 연산한 보정 결과입니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">실시간 산출된 과목별 시간 권장 비중</p>
                  <div className="space-y-4">
                    {subjectPriority.map((subject, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{subject.subject}</span>
                          <span className="text-sm font-bold" style={{ color: subject.color }}>
                            {subject.percentage}%
                            {index === 0 && (
                              <span className="text-xs text-emerald-600 ml-1">(기존의 2.2배 가중)</span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${subject.percentage}%`,
                              backgroundColor: subject.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mb-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">비전 AI OTR 연동 집중도 분석 결과</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        집중 콘텐츠 패턴이 확복 오후 14시~16시에 가장 높은 "수학 미적분" 과목이 집중 예비로 선정되었습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    // TODO: 수업 시작
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  이 주의 AI 추천 시간표 최종 수락
                </Button>

                <Button variant="outline" className="w-full mt-2">
                  설정 다시 만들기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" size="lg" onClick={() => navigate("/analysis")}>
              ← 이전 단계 (약점 분석)
            </Button>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              학습 시작하기 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
