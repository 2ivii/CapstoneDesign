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
import { ChatService } from './chat.service';
import { SolveRequestDto } from './dto/solve-request.dto';
import { FollowupRequestDto } from './dto/followup-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('solve')
  @UseInterceptors(FileInterceptor('image'))
  solve(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: SolveRequestDto,
  ) {
    return this.chatService.solve(image, body);
  }

  @Post('followup')
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
