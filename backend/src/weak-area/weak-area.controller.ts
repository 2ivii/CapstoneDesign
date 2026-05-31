import { Controller, Param, Post } from '@nestjs/common';
import { WeakAreaService } from './weak-area.service';

@Controller('students/:studentId/weak-areas')
export class WeakAreaController {
  constructor(private readonly weakAreaService: WeakAreaService) {}

  /**
   * 학생의 모든 과목 성적을 바탕으로 취약 영역을 분석·생성한다.
   * 틀린 문항(ExamSubject.wrong_answer) ↔ 문제 메타데이터(ExamData.category)를
   * 매칭해 세부 개념별 오답을 집계하고 WeakArea로 저장한다.
   */
  @Post()
  analyze(@Param('studentId') studentId: string) {
    return this.weakAreaService.analyzeStudent(studentId);
  }
}
