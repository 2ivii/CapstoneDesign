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
  @PrimaryGeneratedColumn('increment')
  slot_id: number;

  @Column()
  plan_id: number;

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