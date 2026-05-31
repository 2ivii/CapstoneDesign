import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MockExam } from './mock-exam.entity';

@Entity('exam_datas')
export class ExamData {
  @PrimaryGeneratedColumn('uuid')
  data_id: string;

  @Column()
  exam_id: string;

  @Column({ length: 30 })
  subject: string;

  @Column('int')
  number: number;

  @Column('text', { array: true, default: '{}' })
  category: string[];

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => MockExam, (mockExam) => mockExam.exam_datas)
  @JoinColumn({ name: 'exam_id' })
  mock_exam: MockExam;
}