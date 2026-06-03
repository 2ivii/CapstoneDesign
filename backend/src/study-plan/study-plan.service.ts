import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExamSubject, PlanSlot, Student, StudyPlan, WeakArea } from '../entities';
import { GenerateStudyPlanDto } from './dto/generate-study-plan.dto';

const SUBJECT_ORDER = ['국어', '영어', '수학', '사회', '과학', '한국사'] as const;
const DAILY_TIME_SLOTS = [
  { startTime: '06:00', endTime: '08:00', fixed: null },
  { startTime: '08:00', endTime: '10:00', fixed: null },
  { startTime: '10:00', endTime: '12:00', fixed: null },
  { startTime: '12:00', endTime: '14:00', fixed: { subject: '휴식', unit: '점심시간' } },
  { startTime: '14:00', endTime: '16:00', fixed: null },
  { startTime: '16:00', endTime: '18:00', fixed: null },
  { startTime: '18:00', endTime: '20:00', fixed: { subject: '휴식', unit: '저녁시간' } },
  { startTime: '20:00', endTime: '22:00', fixed: null },
  { startTime: '22:00', endTime: '24:00', fixed: { subject: '휴식', unit: '휴식' } },
] as const;
const WEEK_DAYS = 7;
const DAILY_STUDY_SLOT_COUNT = DAILY_TIME_SLOTS.filter((slot) => !slot.fixed).length;
const WEEKLY_STUDY_SLOT_COUNT = WEEK_DAYS * DAILY_STUDY_SLOT_COUNT;

type PlannerInput = {
  subject: string;
  currentGrade: number | null;
  targetGrade: number | null;
  gradeGap: number;
  weakUnits: string[];
  hasScoreData: boolean;
};

type GeneratedSlot = {
  subject: string;
  unit: string;
};

@Injectable()
export class StudyPlanService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(ExamSubject)
    private readonly examSubjectRepo: Repository<ExamSubject>,
    @InjectRepository(WeakArea)
    private readonly weakAreaRepo: Repository<WeakArea>,
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepo: Repository<StudyPlan>,
    @InjectRepository(PlanSlot)
    private readonly planSlotRepo: Repository<PlanSlot>,
    private readonly config: ConfigService,
  ) {}

  async generateWeeklyPlan(studentId: number, dto: GenerateStudyPlanDto) {
    const startDate = this.resolveDate(dto.date);
    const dates = this.buildWeekDates(startDate);
    const student = await this.studentRepo.findOne({
      where: { student_id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`학생(${studentId})을 찾을 수 없습니다.`);
    }

    const plannerInput = await this.buildPlannerInput(student);
    const aiSlots = await this.generateWithAi(plannerInput);
    const generatedSlots = aiSlots ?? this.generateFallbackSlots(plannerInput);

    const plan = await this.studyPlanRepo.save(
      this.studyPlanRepo.create({ student_id: student.student_id }),
    );
    const slots = await this.planSlotRepo.save(
      dates.flatMap((date, dayIndex) =>
        DAILY_TIME_SLOTS.map((timeSlot, slotIndex) => {
          const previousStudySlotCount =
            dayIndex * DAILY_STUDY_SLOT_COUNT +
            DAILY_TIME_SLOTS.slice(0, slotIndex).filter((slot) => !slot.fixed)
              .length;
          const generatedSlot =
            timeSlot.fixed ?? generatedSlots[previousStudySlotCount];

          return this.planSlotRepo.create({
            plan_id: plan.plan_id,
            subject: generatedSlot.subject,
            unit: generatedSlot.unit,
            date,
            start_time: timeSlot.startTime,
            end_time: timeSlot.endTime,
            isConc: false,
          });
        }),
      ),
    );

    return {
      planId: plan.plan_id,
      studentId: student.student_id,
      startDate,
      endDate: dates[dates.length - 1],
      source: aiSlots ? 'ai' : 'fallback',
      inputs: plannerInput,
      slots,
    };
  }

  async getLatestPlan(studentId: number) {
    const plan = await this.studyPlanRepo.findOne({
      where: { student_id: studentId },
      order: { created_at: 'DESC' },
    });
    if (!plan) {
      throw new NotFoundException(`학생(${studentId})의 시간표가 없습니다.`);
    }

    const slots = await this.planSlotRepo.find({
      where: { plan_id: plan.plan_id },
      order: { date: 'ASC', start_time: 'ASC' },
    });

    return {
      planId: plan.plan_id,
      studentId,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      slots,
    };
  }

  private async buildPlannerInput(student: Student): Promise<PlannerInput[]> {
    const examSubjects = await this.examSubjectRepo.find({
      where: { student_id: student.student_id },
      order: { created_at: 'DESC' },
    });
    if (examSubjects.length === 0 && !student.goal_score?.length) {
      throw new NotFoundException(
        `학생(${student.student_id})의 과목 성적 데이터가 없습니다.`,
      );
    }

    const weakAreas = await this.weakAreaRepo.find({
      where: { subject_id: In(examSubjects.map((subject) => subject.subject_id)) },
    });
    const weakAreasBySubjectId = new Map<number, WeakArea[]>();
    for (const weakArea of weakAreas) {
      const items = weakAreasBySubjectId.get(weakArea.subject_id) ?? [];
      items.push(weakArea);
      weakAreasBySubjectId.set(weakArea.subject_id, items);
    }

    const latestSubjectByName = new Map<string, ExamSubject>();
    for (const subject of examSubjects) {
      if (!latestSubjectByName.has(subject.subject)) {
        latestSubjectByName.set(subject.subject, subject);
      }
    }

    const subjects = [
      ...new Set([
        ...SUBJECT_ORDER.filter((_, index) => student.goal_score?.[index]),
        ...examSubjects.map((subject) => subject.subject),
      ]),
    ];

    return subjects.map((subjectName) => {
      const subject = latestSubjectByName.get(subjectName);
      const targetGrade = this.getTargetGrade(student.goal_score, subjectName);
      const gradeGap =
        !subject || targetGrade === null
          ? 0
          : Math.max(0, subject.grade - targetGrade);
      const weakUnits =
        subject
          ? weakAreasBySubjectId.get(subject.subject_id)?.map((area) => area.unit) ??
            []
          : [];

      return {
        subject: subjectName,
        currentGrade: subject?.grade ?? null,
        targetGrade,
        gradeGap,
        weakUnits: weakUnits.length > 0 ? weakUnits : ['기본 복습'],
        hasScoreData: Boolean(subject),
      };
    });
  }

  private async generateWithAi(
    plannerInput: PlannerInput[],
  ): Promise<GeneratedSlot[] | null> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return null;
    }

    const model = this.config.get('OPENAI_MODEL', 'gpt-4o-mini');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              '너는 학습 시간표 생성기다. 반드시 JSON만 응답한다. 점심, 저녁, 휴식 시간은 서버가 고정하므로 너는 공부 슬롯만 생성한다.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              requirement:
                '7일치 공부 슬롯 42개를 생성하라. 배열 순서는 각 날짜의 06:00, 08:00, 10:00, 14:00, 16:00, 20:00 순서다. 현재 등급과 목표 등급 차이가 큰 과목과 취약 단원이 많은 과목의 비중을 높이되, 입력에 있는 모든 과목을 최소 1회 이상 포함하라. 한 과목이 전체 공부 슬롯의 60%를 초과하지 않게 하라. 응답은 [{"subject":"수학","unit":"삼각비"}] 형태의 JSON 배열 42개만 허용한다.',
              plannerInput,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return null;
    }

    return this.parseGeneratedSlots(content);
  }

  private parseGeneratedSlots(content: string): GeneratedSlot[] | null {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed) || parsed.length !== WEEKLY_STUDY_SLOT_COUNT) {
        return null;
      }

      const slots = parsed.map((slot) => ({
        subject: String(slot.subject ?? '').slice(0, 30),
        unit: String(slot.unit ?? '').slice(0, 50),
      }));
      if (slots.some((slot) => !slot.subject || !slot.unit)) {
        return null;
      }

      return slots;
    } catch {
      return null;
    }
  }

  private generateFallbackSlots(plannerInput: PlannerInput[]): GeneratedSlot[] {
    if (plannerInput.length === 0) {
      throw new BadRequestException('시간표를 생성할 취약 영역이 없습니다.');
    }

    const weightedSubjects = plannerInput.map((input) => ({
      input,
      weight: Math.max(1, input.gradeGap + (input.hasScoreData ? 1 : 0)),
      quota: 0,
      remainder: 0,
    }));
    const totalWeight = weightedSubjects.reduce((sum, item) => sum + item.weight, 0);
    const maxSubjectSlots = Math.floor(WEEKLY_STUDY_SLOT_COUNT * 0.6);

    for (const item of weightedSubjects) {
      const exactQuota = (WEEKLY_STUDY_SLOT_COUNT * item.weight) / totalWeight;
      item.quota = Math.min(maxSubjectSlots, Math.max(1, Math.floor(exactQuota)));
      item.remainder = exactQuota - Math.floor(exactQuota);
    }

    let remaining =
      WEEKLY_STUDY_SLOT_COUNT -
      weightedSubjects.reduce((sum, item) => sum + item.quota, 0);
    for (const item of [...weightedSubjects].sort((a, b) => b.remainder - a.remainder)) {
      if (remaining <= 0) {
        break;
      }
      if (item.quota >= maxSubjectSlots) {
        continue;
      }

      item.quota += 1;
      remaining -= 1;
    }

    const buckets = weightedSubjects
      .map((item) => ({
        ...item,
        remaining: item.quota,
        unitIndex: 0,
      }))
      .sort((a, b) => b.quota - a.quota);
    const slots: GeneratedSlot[] = [];

    while (slots.length < WEEKLY_STUDY_SLOT_COUNT) {
      for (const bucket of buckets) {
        if (bucket.remaining <= 0) {
          continue;
        }

        const unit = bucket.input.weakUnits[bucket.unitIndex % bucket.input.weakUnits.length];
        slots.push({ subject: bucket.input.subject, unit });
        bucket.unitIndex += 1;
        bucket.remaining -= 1;

        if (slots.length === WEEKLY_STUDY_SLOT_COUNT) {
          break;
        }
      }
    }

    return slots;
  }

  private getTargetGrade(goalScore: number[] | null, subject: string): number | null {
    if (!goalScore || goalScore.length < SUBJECT_ORDER.length) {
      return null;
    }

    const index = SUBJECT_ORDER.findIndex((item) => item === subject);
    if (index === -1) {
      return null;
    }

    return goalScore[index];
  }

  private resolveDate(date?: string): string {
    if (!date) {
      return new Date().toISOString().slice(0, 10);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date는 YYYY-MM-DD 형식이어야 합니다.');
    }

    return date;
  }

  private buildWeekDates(startDate: string): string[] {
    const [year, month, day] = startDate.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));

    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const date = new Date(baseDate);
      date.setUTCDate(baseDate.getUTCDate() + index);
      return date.toISOString().slice(0, 10);
    });
  }
}
