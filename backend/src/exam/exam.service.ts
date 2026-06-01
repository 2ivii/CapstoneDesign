import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { MockExam, ExamSubject, Student } from '../entities';

interface SubjectResult {
  subject: string;
  score: number;
  grade: number;
  percentile: number;
  wrong_answers: number[];
  correct_rate: number | null;
}

interface OcrResult {
  exam_name: string;
  year: number;
  subjects: SubjectResult[];
}

interface WrongAnswersResult {
  wrong_answers: Record<string, number[]>;
}

@Injectable()
export class ExamService {
  private readonly openai: OpenAI;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(MockExam)
    private readonly mockExamRepo: Repository<MockExam>,
    @InjectRepository(ExamSubject)
    private readonly examSubjectRepo: Repository<ExamSubject>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') ?? '' });
  }

  async extractAndSave(
    studentId: number,
    file: Express.Multer.File,
  ): Promise<{ exam_id: number; subjects_count: number }> {
    const student = await this.studentRepo.findOneBy({ student_id: studentId });
    if (!student) throw new BadRequestException('Student not found');

    const [mainResult, wrongAnswersResult] = await Promise.all([
      this.callGptMainScores(file),
      this.callGptWrongAnswers(file),
    ]);

    const subjects = mainResult.subjects.map((sub) => ({
      ...sub,
      wrong_answers: wrongAnswersResult.wrong_answers[sub.subject] ?? [],
    }));

    const mockExam = await this.mockExamRepo.save(
      this.mockExamRepo.create({ name: mainResult.exam_name, year: mainResult.year }),
    );

    const examSubjects = subjects.map((sub) =>
      this.examSubjectRepo.create({
        exam_id: mockExam.exam_id,
        student_id: studentId,
        subject: sub.subject,
        score: Math.round(sub.score),
        grade: Math.round(sub.grade),
        percent: Math.round(sub.percentile),
        wrong_answer: sub.wrong_answers,
        correct_rate: sub.correct_rate,
      }),
    );
    await this.examSubjectRepo.save(examSubjects);

    return { exam_id: mockExam.exam_id, subjects_count: examSubjects.length };
  }

  private async callGptMainScores(file: Express.Multer.File): Promise<OcrResult> {
    const prompt = `이 이미지는 한국 모의고사 성적표입니다. 상단 성적 표에서만 데이터를 추출하세요. 하단 채점 결과 표는 무시하세요.

## 과목(subject) 추출 규칙
- 상단 성적 표의 [영역] 열에서 국어, 수학, 영어, 한국사는 해당 이름 그대로 추출합니다.
- 탐구 행은 [영역] 열 오른쪽에 세부 과목명이 별도로 표시됩니다. 세부 과목명을 각각 독립된 항목으로 추출합니다. "탐구"라는 이름은 사용하지 않습니다.

## 각 필드 추출 위치
- exam_name: 성적표 상단의 시험 전체 명칭
- year: exam_name에서 연도 숫자만 추출
- score: 상단 표의 [원점수 > 득점] 열 값
- grade: 상단 표의 [표준점수에 의한 석차/백분위/등급 > 등급] 열 값 (정수)
- percentile: 상단 표의 [표준점수에 의한 석차/백분위/등급 > 전국백분위] 열 값 (숫자)

## 출력 형식
반드시 아래 JSON만 반환하세요. 마크다운 코드블록이나 설명 텍스트는 절대 포함하지 마세요.
{
  "exam_name": "시험 전체 명칭 (예: 2026학년도 3월 고1 전국연합학력평가)",
  "year": 연도_숫자,
  "subjects": [
    {
      "subject": "과목명",
      "score": 득점_숫자,
      "grade": 등급_숫자,
      "percentile": 전국백분위_숫자,
      "wrong_answers": [],
      "correct_rate": null
    }
  ]
}`;

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-5.4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = (response.choices[0].message.content ?? '')
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    try {
      return JSON.parse(text) as OcrResult;
    } catch {
      throw new BadRequestException(`GPT 성적 파싱 실패: ${text.slice(0, 200)}`);
    }
  }

  private async callGptWrongAnswers(file: Express.Multer.File): Promise<WrongAnswersResult> {
    const prompt = `이 이미지는 한국 모의고사 성적표의 하단 채점 결과 표입니다.

## 표 구조
각 과목(국어, 수학, 영어, 한국사, 탐구)마다 4개의 행이 있습니다:
- 1행 "답안": 학생이 작성한 답
- 2행 "정답": 실제 정답
- 3행 "채점결과": O 또는 X (이 행은 무시하세요)
- 4행 "정답률": 알파벳 등급 (이 행도 무시하세요)

열 번호는 문항 번호(1, 2, 3, ...)입니다.

## 과목별 문항 수
- 국어: 1~45번
- 수학: 1~30번 (일부 문항은 두 자리 이상 숫자 답)
- 영어: 1~45번
- 한국사: 1~20번
- 탐구: 과목별 1~25번 (사회/과학 등 별도 표로 나뉨)

## 추출 방법
채점결과 행(O/X)은 읽지 마세요. 대신:
1. "답안" 행의 값과 "정답" 행의 값을 문항별로 비교하세요
2. 답안 ≠ 정답이면 해당 문항 번호가 오답입니다
3. 답안이 비어있는 문항도 오답입니다

## 탐구 과목 식별
탐구 표는 별도로 있으며, "사회"와 "과학" 등 과목명이 표시되어 있습니다.
각 세부 과목별로 독립적으로 추출하세요.

## 출력 형식
JSON만 반환하세요. 마크다운 코드블록이나 설명 텍스트는 절대 포함하지 마세요.
{
  "wrong_answers": {
    "국어": [문항번호_배열],
    "수학": [문항번호_배열],
    "영어": [문항번호_배열],
    "한국사": [문항번호_배열],
    "사회": [문항번호_배열],
    "과학": [문항번호_배열]
  }
}

## 주의사항
- 문항 번호는 정수 배열
- 오답이 없으면 빈 배열 []
- 탐구 과목명은 표에 적힌 그대로 사용
- 반드시 답안과 정답을 직접 비교하여 판단하세요`;

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-5.4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = (response.choices[0].message.content ?? '')
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    try {
      return JSON.parse(text) as WrongAnswersResult;
    } catch {
      throw new BadRequestException(`GPT 오답 파싱 실패: ${text.slice(0, 200)}`);
    }
  }
}
