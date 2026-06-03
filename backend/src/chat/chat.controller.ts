import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SolveRequestDto } from './dto/solve-request.dto';
import { FollowupRequestDto } from './dto/followup-request.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('solve')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image:      { type: 'string', format: 'binary', description: '문제 사진 (필수)' },
        subject:    { type: 'string', description: '과목 힌트 (선택) — 수학/국어/영어/과학/사회' },
        message:    { type: 'string', description: '추가 질문 (선택)' },
        studentId:  { type: 'string', description: '학생 ID (선택) — 없으면 세션 저장 스킵' },
        chatId:     { type: 'string', description: '기존 세션 ID (선택) — 이어서 풀이' },
        examYear:   { type: 'string', description: '학년도 (선택) — 예: 2026' },
        examMonth:  { type: 'string', description: '월 (선택) — 예: 3' },
        examOrg:    { type: 'string', description: '시행주체 (선택) — 교육청 | 평가원 | 수능' },
        examGrade:  { type: 'string', description: '학년 (선택) — 고1 | 고2 | 고3 (수능이면 생략)' },
        questionNo: { type: 'string', description: '문항 번호 (선택) — 예: 21' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  solve(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: SolveRequestDto,
  ) {
    return this.chatService.solve(image, body);
  }

  @Post('followup')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['chatId', 'message'],
      properties: {
        chatId:  { type: 'number', description: '세션 ID' },
        message: { type: 'string', description: '후속 질문' },
      },
    },
  })
  followup(@Body() body: FollowupRequestDto) {
    return this.chatService.followup(body);
  }

  @Get('sessions/:studentId')
  getSessions(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.chatService.getSessions(studentId);
  }

  @Get('messages/:chatId')
  getMessages(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatService.getMessages(chatId);
  }
}
