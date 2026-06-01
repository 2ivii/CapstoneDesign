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
  grade_level: number;
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
      this.mockExamRepo.create({
        name: mainResult.exam_name,
        year: mainResult.year,
        grade_level: mainResult.grade_level,
      }),
    );

    const examSubjects = subjects.map((sub) =>
      this.examSubjectRepo.create({
        exam_id: mockExam.exam_id,
        student_id: studentId,
        subject: sub.subject,
        score: Math.round(sub.score * 10) / 10,
        grade: Math.round(sub.grade),
        percent: Math.round(sub.percentile * 100) / 100,
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
  "grade_level": 학년_정수 (고1=1, 고2=2, 고3=3),
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
      model: 'gpt-5.5',
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
각 과목(국어, 수학, 영어, 한국사, 탐구)마다 4개의 행이 반복됩니다:
- 1행 "답안": 숫자 또는 알파벳
- 2행 "정답": 숫자 또는 알파벳
- 3행 "채점결과": O 또는 X만 있음 ← 이 행만 읽으세요
- 4행 "정답률": B, C, D, E 같은 알파벳 등급 ← 무시

열 헤더가 문항 번호(1, 2, 3, ...)입니다.

## O와 X 구분 가이드
- O: 동그란 원형, 안이 비어있음, 둥글게 생김
- X: 두 직선이 교차, 대각선 두 줄이 겹침
- 이 두 기호만 존재합니다. 다른 기호는 없습니다.
- 헷갈리면 바로 위의 답안 행과 정답 행을 비교하세요. 답안=정답이면 O, 다르면 X입니다.

## 과목별 문항 수
- 국어: 1~45번
- 수학: 1~30번
- 영어: 1~45번
- 한국사: 1~20번
- 탐구: 과목별 1~25번 (사회, 과학 등 별도 표)

## 추출 대상
3행 "채점결과"에서 X인 문항 번호만 추출하세요.

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
- 문항 번호는 정수 배열, 오답 없으면 []
- 탐구 과목명은 표에 적힌 세부 과목명 그대로 사용
- 4행 정답률(B, C, D 등)을 X로 착각하지 마세요. 채점결과는 반드시 3행입니다`;

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-5.5',
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
