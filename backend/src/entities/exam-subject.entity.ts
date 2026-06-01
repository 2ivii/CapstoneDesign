import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { MockExam } from './mock-exam.entity';
import { WeakArea } from './weak-area.entity';

@Entity('exam_subjects')
export class ExamSubject {
  @PrimaryGeneratedColumn('uuid')
  subject_id: string;

  @Column()
  exam_id: string;

  @Column('int')
  student_id: number;

  @Column({ length: 30 })
  subject: string;

  @Column('int')
  grade: number;

  @Column('int')
  score: number;

  @Column('int')
  percent: number;

  @Column('int', { array: true, default: '{}' })
  wrong_answer: number[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  correct_rate: number | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => MockExam, (mockExam) => mockExam.exam_subjects)
  @JoinColumn({ name: 'exam_id' })
  mock_exam: MockExam;

  @ManyToOne(() => Student, (student) => student.exam_subjects)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => WeakArea, (weakArea) => weakArea.exam_subject)
  weak_areas: WeakArea[];
}