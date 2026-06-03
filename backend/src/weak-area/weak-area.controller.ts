import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WeakAreaService } from './weak-area.service';

@ApiTags('취약영역 분석')
@Controller('students/:studentId/weak-areas')
export class WeakAreaController {
  constructor(private readonly weakAreaService: WeakAreaService) {}

  /**
   * 학생의 모든 과목 성적을 바탕으로 취약 영역을 분석·생성한다.
   * 틀린 문항(ExamSubject.wrong_answer) ↔ 문제 메타데이터(ExamData.category)를
   * 매칭해 세부 개념별 오답을 집계하고 WeakArea로 저장한다.
   */
  @Post()
  @ApiOperation({
    summary: '취약영역 분석 실행',
    description:
      '학생의 모든 과목에서 틀린 문항과 문제 메타데이터를 매칭해 세부 개념별 오답을 집계, WeakArea를 생성한다. 재호출 시 기존 결과를 삭제하고 재생성한다.',
  })
  @ApiParam({ name: 'studentId', description: '학생 ID', type: Number })
  analyze(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.weakAreaService.analyzeStudent(studentId);
  }

  @Get('summary')
  @ApiOperation({
    summary: '과목별 약점 분석 요약 조회',
    description:
      '학생의 최근 3회 과목 성적과 문제 메타데이터를 기반으로 전체 정답률, 단원별 정답률, 취약 개념, 최근 성적 추이를 조회한다.',
  })
  @ApiParam({ name: 'studentId', description: '학생 ID', type: Number })
  @ApiQuery({
    name: 'subject',
    description: '조회할 과목명. 생략하면 전체 과목을 조회한다.',
    required: false,
    example: '수학',
  })
  getSummary(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('subject') subject?: string,
  ) {
    return this.weakAreaService.getSummary(studentId, subject);
  }
}
