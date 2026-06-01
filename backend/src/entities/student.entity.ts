import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExamSubject } from './exam-subject.entity';
import { StudyPlan } from './study-plan.entity';
import { ChatSession } from './chat-session.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('increment')
  student_id: number;

  @Column('int', { array: true, nullable: true })
  goal_score: number[];

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ExamSubject, (examSubject) => examSubject.student)
  exam_subjects: ExamSubject[];

  @OneToMany(() => StudyPlan, (plan) => plan.student)
  study_plans: StudyPlan[];

  @OneToMany(() => ChatSession, (session) => session.student)
  chat_sessions: ChatSession[];
}