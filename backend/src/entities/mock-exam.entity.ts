import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { ExamSubject } from './exam-subject.entity';
import { ExamData } from './exam-data.entity';

@Entity('mock_exams')
export class MockExam {
  @PrimaryGeneratedColumn('increment')
  exam_id: number;

  @Column({ length: 100 })
  name: string;

  @Column('int')
  year: number;

  // 대상 학년 (1 = 고1, 2 = 고2, 3 = 고3)
  @Column('int')
  grade_level: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ExamSubject, (examSubject) => examSubject.mock_exam)
  exam_subjects: ExamSubject[];

  @OneToMany(() => ExamData, (examData) => examData.mock_exam)
  exam_datas: ExamData[];
}