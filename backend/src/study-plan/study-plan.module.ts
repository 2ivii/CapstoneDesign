import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSubject, PlanSlot, Student, StudyPlan, WeakArea } from '../entities';
import { StudyPlanController } from './study-plan.controller';
import { StudyPlanService } from './study-plan.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      ExamSubject,
      WeakArea,
      StudyPlan,
      PlanSlot,
    ]),
  ],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
})
export class StudyPlanModule {}
