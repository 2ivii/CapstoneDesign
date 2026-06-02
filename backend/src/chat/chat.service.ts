import { Injectable, BadRequestException } from '@nestjs/common';
import { buildChatGraph } from './chat.graph';
import { SolveRequestDto } from './dto/solve-request.dto';

@Injectable()
export class ChatService {
  async solve(
    file: Express.Multer.File,
    dto: SolveRequestDto,
  ): Promise<{ subject: string; solution: string; conceptTags: string[] }> {
    if (!file) throw new BadRequestException('이미지 파일이 필요합니다.');

    const image = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const graph = buildChatGraph();
    const result = await graph.invoke({
      image,
      mimeType,
      subject: dto.subject ?? '',
      userMessage: dto.message,
    });

    return {
      subject: result.subject,
      solution: result.solution,
      conceptTags: result.conceptTags,
    };
  }
}
