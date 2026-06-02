import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SolveRequestDto } from './dto/solve-request.dto';

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
}
