import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExamSubject, ExamData, WeakArea } from '../entities';

type Trend = 'up' | 'down';
type WeakDifficulty = '상' | '중' | '하';

type RecentScore = {
  exam: string;
  score: number;
  grade: number;
};

type UnitAccuracy = {
  unit: string;
  accuracy: number;
  total: number;
  correct: number;
};

type WeakConcept = {
  concept: string;
  wrongCount: number;
  difficulty: WeakDifficulty;
};

type SubjectSummary = {
  id: string;
  name: string;
  overallAccuracy: number;
  grade: string;
  trend: Trend;
  unitAccuracy: UnitAccuracy[];
  weakConcepts: WeakConcept[];
  recentScores: RecentScore[];
};

@Injectable()
export class WeakAreaService {
  constructor(
    @InjectRepository(ExamSubject)
    private readonly examSubjectRepo: Repository<ExamSubject>,
    @InjectRepository(ExamData)
    private readonly examDataRepo: Repository<ExamData>,
    @InjectRepository(WeakArea)
    private readonly weakAreaRepo: Repository<WeakArea>,
  ) {}

  /**
   * 학생의 모든 ExamSubject를 순회하며 취약 영역을 재생성한다.
   * 멱등성: 분석 대상 과목의 기존 WeakArea를 지우고 다시 만든다.
   */
  async analyzeStudent(studentId: number): Promise<WeakArea[]> {
    const subjects = await this.examSubjectRepo.find({
      where: { student_id: studentId },
    });
    if (subjects.length === 0) {
      throw new NotFoundException(
        `학생(${studentId})의 시험 과목 데이터가 없습니다.`,
      );
    }

    const created: WeakArea[] = [];
    for (const subject of subjects) {
      created.push(...(await this.analyzeSubject(subject)));
    }
    return created;
  }

  async getSummary(studentId: number): Promise<{ subjects: SubjectSummary[] }> {
    const subjects = await this.examSubjectRepo
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.mock_exam', 'mockExam')
      .where('subject.student_id = :studentId', { studentId })
      .orderBy('subject.subject', 'ASC')
      .addOrderBy('mockExam.year', 'DESC')
      .addOrderBy('mockExam.created_at', 'DESC')
      .addOrderBy('subject.created_at', 'DESC')
      .getMany();

    if (subjects.length === 0) {
      throw new NotFoundException(
        `학생(${studentId})의 시험 과목 데이터가 없습니다.`,
      );
    }

    const subjectsByName = new Map<string, ExamSubject[]>();
    for (const subject of subjects) {
      const items = subjectsByName.get(subject.subject) ?? [];
      items.push(subject);
      subjectsByName.set(subject.subject, items);
    }

    const summaries: SubjectSummary[] = [];
    for (const [subjectName, subjectItems] of subjectsByName.entries()) {
      summaries.push(await this.buildSubjectSummary(subjectName, subjectItems.slice(0, 3)));
    }

    return { subjects: summaries };
  }

  /** 한 과목(ExamSubject)의 오답을 개념별로 집계해 WeakArea로 저장한다. */
  private async analyzeSubject(subject: ExamSubject): Promise<WeakArea[]> {
    // 재분석 시 중복 누적을 막기 위해 기존 결과를 먼저 제거한다.
    await this.weakAreaRepo.delete({ subject_id: subject.subject_id });

    if (!subject.wrong_answer || subject.wrong_answer.length === 0) {
      return [];
    }

    // 틀린 문항의 메타데이터: 같은 시험·과목에서 문항 번호가 일치하는 ExamData.
    const wrongProblems = await this.examDataRepo.find({
      where: {
        exam_id: subject.exam_id,
        subject: subject.subject,
        number: In(subject.wrong_answer),
      },
    });

    // category 태그 → 틀린 문항 번호 목록.
    // 대분류/소분류를 나누지 않고, 한 문항 안의 중복 태그만 제거해 동등하게 집계한다.
    const conceptToNumbers = new Map<string, Set<number>>();
    for (const problem of wrongProblems) {
      for (const concept of this.uniqueCategories(problem.category)) {
        const numbers = conceptToNumbers.get(concept) ?? new Set<number>();
        numbers.add(problem.number);
        conceptToNumbers.set(concept, numbers);
      }
    }

    const weakAreas = [...conceptToNumbers.entries()].map(([concept, numbers]) =>
      this.weakAreaRepo.create({
        subject_id: subject.subject_id,
        unit: concept,
        content: this.buildContent(concept, [...numbers]),
      }),
    );

    return this.weakAreaRepo.save(weakAreas);
  }

  private uniqueCategories(categories: string[]): string[] {
    return [...new Set(categories)];
  }

  private async buildSubjectSummary(
    subjectName: string,
    recentSubjects: ExamSubject[],
  ): Promise<SubjectSummary> {
    const unitStats = new Map<string, { total: number; correct: number; wrong: number }>();
    let totalProblems = 0;
    let totalCorrect = 0;

    for (const subject of recentSubjects) {
      const examData = await this.findReusableExamData(subject);
      const wrongNumbers = new Set(subject.wrong_answer ?? []);

      for (const problem of examData) {
        const isCorrect = !wrongNumbers.has(problem.number);
        totalProblems += 1;
        if (isCorrect) {
          totalCorrect += 1;
        }

        for (const unit of this.uniqueCategories(problem.category)) {
          const stats = unitStats.get(unit) ?? { total: 0, correct: 0, wrong: 0 };
          stats.total += 1;
          if (isCorrect) {
            stats.correct += 1;
          } else {
            stats.wrong += 1;
          }
          unitStats.set(unit, stats);
        }
      }
    }

    const latestSubject = recentSubjects[0];
    const unitAccuracy = [...unitStats.entries()]
      .map(([unit, stats]) => ({
        unit,
        accuracy: this.toPercent(stats.correct, stats.total),
        total: stats.total,
        correct: stats.correct,
      }))
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

    const weakConcepts = [...unitStats.entries()]
      .filter(([, stats]) => stats.wrong > 0)
      .map(([concept, stats]) => ({
        concept,
        wrongCount: stats.wrong,
        difficulty: this.toDifficulty(stats.wrong),
      }))
      .sort((a, b) => b.wrongCount - a.wrongCount || a.concept.localeCompare(b.concept));

    const recentScores = [...recentSubjects]
      .reverse()
      .map((subject) => ({
        exam: this.getExamLabel(subject),
        score: Number(subject.score),
        grade: subject.grade,
      }));

    return {
      id: this.toSubjectId(subjectName),
      name: subjectName,
      overallAccuracy: this.resolveOverallAccuracy(recentSubjects, totalCorrect, totalProblems),
      grade: `${latestSubject.grade}등급`,
      trend: this.resolveTrend(recentScores),
      unitAccuracy,
      weakConcepts,
      recentScores,
    };
  }

  private async findReusableExamData(subject: ExamSubject): Promise<ExamData[]> {
    const exact = await this.examDataRepo.find({
      where: { exam_id: subject.exam_id, subject: subject.subject },
      order: { number: 'ASC' },
    });
    if (exact.length > 0) {
      return exact;
    }

    const fallbackExam = await this.examDataRepo
      .createQueryBuilder('examData')
      .where('examData.subject = :subject', { subject: subject.subject })
      .select('examData.exam_id', 'exam_id')
      .addSelect('MAX(examData.created_at)', 'latest_created_at')
      .groupBy('examData.exam_id')
      .orderBy('latest_created_at', 'DESC')
      .getRawOne<{ exam_id: number }>();

    if (!fallbackExam) {
      return [];
    }

    return this.examDataRepo.find({
      where: { exam_id: fallbackExam.exam_id, subject: subject.subject },
      order: { number: 'ASC' },
    });
  }

  private resolveOverallAccuracy(
    recentSubjects: ExamSubject[],
    totalCorrect: number,
    totalProblems: number,
  ): number {
    if (totalProblems > 0) {
      return this.toPercent(totalCorrect, totalProblems);
    }

    const rates = recentSubjects
      .map((subject) => subject.correct_rate)
      .filter((rate): rate is number => rate !== null && rate !== undefined)
      .map(Number);

    if (rates.length > 0) {
      return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
    }

    return 0;
  }

  private resolveTrend(recentScores: RecentScore[]): Trend {
    if (recentScores.length < 2) {
      return 'up';
    }

    return recentScores[recentScores.length - 1].score >= recentScores[0].score
      ? 'up'
      : 'down';
  }

  private toPercent(correct: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return Math.round((correct / total) * 100);
  }

  private toDifficulty(wrongCount: number): WeakDifficulty {
    if (wrongCount >= 5) {
      return '상';
    }
    if (wrongCount >= 3) {
      return '중';
    }
    return '하';
  }

  private getExamLabel(subject: ExamSubject): string {
    const examName = subject.mock_exam?.name ?? '';
    const monthMatch = examName.match(/(\d{1,2})월/);
    if (monthMatch) {
      return `${monthMatch[1]}월`;
    }

    return String(subject.mock_exam?.year ?? subject.exam_id);
  }

  private toSubjectId(subject: string): string {
    const ids: Record<string, string> = {
      국어: 'korean',
      수학: 'math',
      영어: 'english',
      한국사: 'history',
      생명과학1: 'science1',
      지구과학1: 'science2',
    };

    return ids[subject] ?? subject;
  }

  /**
   * 취약 영역 한 줄 설명을 생성한다.
   * 메타데이터가 늘어나거나 LLM을 붙일 경우 이 메서드만 교체하면 된다.
   */
  private buildContent(concept: string, numbers: number[]): string {
    const nums = [...numbers].sort((a, b) => a - b).join(', ');
    return `${concept} 유형에서 ${numbers.length}문항 오답 (${nums}번)`;
  }
}
