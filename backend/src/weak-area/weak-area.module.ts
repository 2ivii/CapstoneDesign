import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSubject, ExamData, WeakArea } from '../entities';
import { WeakAreaController } from './weak-area.controller';
import { WeakAreaService } from './weak-area.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExamSubject, ExamData, WeakArea])],
  controllers: [WeakAreaController],
  providers: [WeakAreaService],
})
export class WeakAreaModule {}
