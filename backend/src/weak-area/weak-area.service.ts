import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExamSubject, ExamData, WeakArea } from '../entities';

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

    // 세부 개념(category 태그) → 틀린 문항 번호 목록
    const conceptToNumbers = new Map<string, number[]>();
    for (const problem of wrongProblems) {
      for (const concept of problem.category) {
        const numbers = conceptToNumbers.get(concept) ?? [];
        numbers.push(problem.number);
        conceptToNumbers.set(concept, numbers);
      }
    }

    const weakAreas = [...conceptToNumbers.entries()].map(([concept, numbers]) =>
      this.weakAreaRepo.create({
        subject_id: subject.subject_id,
        unit: concept,
        content: this.buildContent(concept, numbers),
      }),
    );

    return this.weakAreaRepo.save(weakAreas);
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
