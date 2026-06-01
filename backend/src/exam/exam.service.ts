import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  private readonly gemini: GoogleGenerativeAI;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(MockExam)
    private readonly mockExamRepo: Repository<MockExam>,
    @InjectRepository(ExamSubject)
    private readonly examSubjectRepo: Repository<ExamSubject>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {
    this.gemini = new GoogleGenerativeAI(config.get('GEMINI_API_KEY') ?? '');
  }

  async extractAndSave(
    studentId: number,
    file: Express.Multer.File,
  ): Promise<{ exam_id: string; subjects_count: number }> {
    const student = await this.studentRepo.findOneBy({ student_id: studentId });
    if (!student) throw new BadRequestException('Student not found');

    const ocrResult = await this.callGeminiOcr(file);

    const mockExam = await this.mockExamRepo.save(
      this.mockExamRepo.create({ name: ocrResult.exam_name, year: ocrResult.year }),
    );

    const examSubjects = ocrResult.subjects.map((sub) =>
      this.examSubjectRepo.create({
        exam_id: mockExam.exam_id,
        student_id: studentId,
        subject: sub.subject,
        score: sub.score,
        grade: sub.grade,
        percent: sub.percentile,
        wrong_answer: sub.wrong_answers ?? [],
        correct_rate: sub.correct_rate,
      }),
    );
    await this.examSubjectRepo.save(examSubjects);

    return { exam_id: mockExam.exam_id, subjects_count: examSubjects.length };
  }

  private async callGeminiOcr(file: Express.Multer.File): Promise<OcrResult> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `이 이미지는 한국 수능 모의고사 성적표입니다. 다음 JSON 형식으로 정보를 추출해주세요.

{
  "exam_name": "시험 전체 명칭 (예: 2026년 3월 고1 전국연합학력평가)",
  "year": 연도_숫자,
  "subjects": [
    {
      "subject": "과목명 (국어/수학/영어/한국사/사회탐구 과목명 등)",
      "score": 원점수_숫자,
      "grade": 등급_숫자,
      "percentile": 백분위_숫자,
      "wrong_answers": [틀린_문항_번호_배열],
      "correct_rate": 정답률_숫자_또는_null
    }
  ]
}

틀린 문항은 답안 표기 그리드에서 X 표시된 문항 번호를 추출해주세요.
JSON만 반환하고 마크다운 코드블록이나 다른 텍스트는 포함하지 마세요.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        },
      },
    ]);

    const text = result.response
      .text()
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    try {
      return JSON.parse(text) as OcrResult;
    } catch {
      throw new BadRequestException(`Gemini 응답 파싱 실패: ${text.slice(0, 200)}`);
    }
  }
}
