import { Controller, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamService } from './exam.service';

@Controller('students/:studentId/exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExamImage(
    @Param('studentId') studentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examService.extractAndSave(studentId, file);
  }
}
