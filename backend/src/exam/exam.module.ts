import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockExam, ExamSubject, Student } from '../entities';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [TypeOrmModule.forFeature([MockExam, ExamSubject, Student])],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
