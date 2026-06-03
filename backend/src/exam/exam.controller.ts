import { Controller, Post, Param, ParseIntPipe, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ExamService } from './exam.service';

@Controller('students/:studentId/exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '모의고사 성적표 이미지' },
      },
      required: ['file'],
    },
  })
  async uploadExamImage(
    @Param('studentId', ParseIntPipe) studentId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('이미지 파일을 첨부해주세요');
    return this.examService.extractAndSave(studentId, file);
  }

  @Post(':examId/wrong-answers')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '모의고사 성적표 이미지 (오답 추출용)' },
      },
      required: ['file'],
    },
  })
  async extractWrongAnswers(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('examId', ParseIntPipe) examId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('이미지 파일을 첨부해주세요');
    return this.examService.extractWrongAnswers(studentId, examId, file);
  }
}
