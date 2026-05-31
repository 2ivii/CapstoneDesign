import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudyPlan } from './study-plan.entity';

@Entity('plan_slots')
export class PlanSlot {
  @PrimaryGeneratedColumn('uuid')
  slot_id: string;

  @Column()
  plan_id: string;

  @Column({ length: 30 })
  subject: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ length: 10 })
  date: string;

  @Column('time')
  start_time: string;

  @Column('time')
  end_time: string;

  @Column({ default: false })
  isConc: boolean;

  @ManyToOne(() => StudyPlan, (plan) => plan.plan_slots)
  @JoinColumn({ name: 'plan_id' })
  study_plan: StudyPlan;
}