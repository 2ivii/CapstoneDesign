export class SolveRequestDto {
  studentId?: string;
  chatId?: string;
  subject?: string;
  message?: string;
  // 시험 정보 (사용자가 직접 입력 — 있으면 LLM 식별 스킵)
  examYear?: string;   // 학년도, 예: "2026"
  examMonth?: string;  // 월, 예: "3"
  examOrg?: string;    // 시행주체: "교육청" | "평가원" | "수능"
  examGrade?: string;  // 학년: "고1" | "고2" | "고3" (수능이면 생략)
  questionNo?: string; // 문항 번호, 예: "21"
}
