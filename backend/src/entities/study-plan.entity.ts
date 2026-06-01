import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { PlanSlot } from './plan-slot.entity';

@Entity('study_plans')
export class StudyPlan {
  @PrimaryGeneratedColumn('increment')
  plan_id: number;

  @Column()
  student_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Student, (student) => student.study_plans)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => PlanSlot, (slot) => slot.study_plan)
  plan_slots: PlanSlot[];
}