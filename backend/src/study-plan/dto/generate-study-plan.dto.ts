import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateStudyPlanDto {
  @ApiPropertyOptional({
    description:
      '일주일 시간표를 생성할 시작 날짜. 생략하면 오늘 날짜를 시작일로 사용한다.',
    example: '2026-06-03',
  })
  date?: string;
}
