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

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ExamSubject, (examSubject) => examSubject.mock_exam)
  exam_subjects: ExamSubject[];

  @OneToMany(() => ExamData, (examData) => examData.mock_exam)
  exam_datas: ExamData[];
}