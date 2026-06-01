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

    const ocrResult = await this.callGptOcr(file);

    const mockExam = await this.mockExamRepo.save(
      this.mockExamRepo.create({ name: ocrResult.exam_name, year: ocrResult.year }),
    );

    const examSubjects = ocrResult.subjects.map((sub) =>
      this.examSubjectRepo.create({
        exam_id: mockExam.exam_id,
        student_id: studentId,
        subject: sub.subject,
        score: Math.round(sub.score),
        grade: Math.round(sub.grade),
        percent: Math.round(sub.percentile),
        wrong_answer: sub.wrong_answers ?? [],
        correct_rate: sub.correct_rate,
      }),
    );
    await this.examSubjectRepo.save(examSubjects);

    return { exam_id: mockExam.exam_id, subjects_count: examSubjects.length };
  }

  private async callGptOcr(file: Express.Multer.File): Promise<OcrResult> {
    const prompt = `이 이미지는 한국 수능 모의고사 성적표입니다. 아래 규칙을 정확히 따라 JSON을 추출하세요.

## 과목(subject) 추출 규칙
- 상단 성적 표의 [영역] 열에서 국어, 수학, 영어, 한국사는 해당 이름 그대로 추출합니다.
- 탐구 행은 [영역] 열 오른쪽에 세부 과목명이 별도로 표시됩니다(예: 사회, 과학, 생명과학 등). 세부 과목명을 각각 독립된 항목으로 추출합니다. "탐구"라는 이름은 사용하지 않습니다.

## 각 필드 추출 위치
- exam_name: 성적표 상단의 시험 전체 명칭 (예: "2026학년도 3월 고1 전국연합학력평가")
- year: exam_name에서 연도 숫자만 추출 (예: 2026)
- score: 상단 표의 [원점수 > 배점] 열 값 (숫자)
- grade: 상단 표의 [표준점수에 의한 석차/백분위/등급 > 등급] 열 값 (숫자)
- percentile: 상단 표의 [표준점수에 의한 석차/백분위/등급 > 전국백분위] 열 값 (숫자)
- wrong_answers: 하단 [영역/문항] 채점 결과 표에서 해당 과목 행에 X로 표시된 문항 번호만 배열로 추출 (O, △ 등은 제외)

## 출력 형식
반드시 아래 JSON만 반환하세요. 마크다운 코드블록이나 설명 텍스트는 절대 포함하지 마세요.
{
  "exam_name": "시험 전체 명칭 (예: 2026학년도 3월 고1 전국연합학력평가)",
  "year": 연도_숫자,
  "subjects": [
    {
      "subject": "과목명",
      "score": 배점_숫자,
      "grade": 등급_숫자,
      "percentile": 전국백분위_숫자,
      "wrong_answers": [X표시_문항번호_숫자_배열],
      "correct_rate": null
    }
  ]
}`;

    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
      throw new BadRequestException(`GPT 응답 파싱 실패: ${text.slice(0, 200)}`);
    }
  }
}
