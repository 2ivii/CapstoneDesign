import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ExamSubject } from './exam-subject.entity';

@Entity('weak_areas')
export class WeakArea {
  @PrimaryGeneratedColumn('increment')
  weak_id: number;

  @Column()
  subject_id: number;

  @Column({ length: 100 })
  unit: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ExamSubject, (examSubject) => examSubject.weak_areas)
  @JoinColumn({ name: 'subject_id' })
  exam_subject: ExamSubject;
}