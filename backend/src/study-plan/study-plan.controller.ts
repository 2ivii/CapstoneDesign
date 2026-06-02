import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GenerateStudyPlanDto } from './dto/generate-study-plan.dto';
import { StudyPlanService } from './study-plan.service';

@ApiTags('AI 시간표')
@Controller('students/:studentId/study-plans')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'AI 일주일 시간표 생성',
    description:
      '학생의 현재 등급, 목표 등급(goal_score), 취약 영역을 기반으로 7일치 06:00~24:00 2시간 단위 시간표를 생성해 저장한다.',
  })
  @ApiParam({ name: 'studentId', description: '학생 ID', type: Number })
  @ApiBody({ type: GenerateStudyPlanDto, required: false })
  generate(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: GenerateStudyPlanDto = {},
  ) {
    return this.studyPlanService.generateWeeklyPlan(studentId, dto);
  }

  @Get('latest')
  @ApiOperation({ summary: '최근 생성된 시간표 조회' })
  @ApiParam({ name: 'studentId', description: '학생 ID', type: Number })
  getLatest(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.studyPlanService.getLatestPlan(studentId);
  }
}
