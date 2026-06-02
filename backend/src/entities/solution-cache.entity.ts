import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('solution_cache')
@Unique(['exam_id', 'question_no'])
export class SolutionCache {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 50 })
  exam_id: string;

  @Column()
  question_no: number;

  @Column({ length: 20 })
  subject: string;

  @Column('text')
  solution_text: string;

  @Column('simple-array', { nullable: true })
  concept_tags: string[];

  @Column({ length: 10, nullable: true })
  answer: string;

  @Column({ length: 10, default: 'high' })
  confidence: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
