import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { SolutionCache } from '../entities/solution-cache.entity';
import { buildChatGraph, ConversationEntry } from './chat.graph';
import { SolveRequestDto } from './dto/solve-request.dto';
import { FollowupRequestDto } from './dto/followup-request.dto';
import {
  SolveResponseDto,
  FollowupResponseDto,
  SessionDto,
  MessageDto,
} from './dto/chat-response.dto';

const KNOWN_SUBJECTS = ['수학', '국어', '영어', '과학', '사회'];

function buildExamId(dto: SolveRequestDto): string {
  const { examYear, examMonth, examOrg, examGrade } = dto;
  if (!examYear || !examOrg) return '';
  if (examOrg === '수능') return `${examYear}_수능`;
  if (!examMonth || !examGrade) return '';
  const month = examMonth.padStart(2, '0');
  return `${examYear}_${month}_${examOrg}_${examGrade}`;
}

@Injectable()
export class ChatService {
  private readonly graph: ReturnType<typeof buildChatGraph>;

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(SolutionCache)
    private readonly solutionCacheRepo: Repository<SolutionCache>,
  ) {
    this.graph = buildChatGraph(solutionCacheRepo);
  }

  async solve(
    file: Express.Multer.File,
    dto: SolveRequestDto,
  ): Promise<SolveResponseDto> {
    if (!file) throw new BadRequestException('이미지 파일이 필요합니다.');

    const image = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const studentId = dto.studentId ? Number(dto.studentId) : undefined;
    const chatId = dto.chatId ? Number(dto.chatId) : undefined;

    const examId = buildExamId(dto);
    const questionNo = dto.questionNo ? Number(dto.questionNo) : 0;

    const result = await this.graph.invoke({
      image,
      mimeType,
      subject: dto.subject ?? '',
      userMessage: dto.message,
      conversationHistory: [],
      examId,
      questionNo,
    });

    const baseResponse: SolveResponseDto = {
      subject: result.subject,
      solution: result.solution,
      conceptTags: result.conceptTags,
      confidence: result.confidence,
      problemCount: result.problemCount,
      isValid: result.isValid,
      errorMessage: result.errorMessage,
    };

    if (!studentId) return baseResponse;
    if (!result.isValid) return baseResponse;

    let session: ChatSession;
    if (chatId) {
      const found = await this.sessionRepo.findOne({ where: { chat_id: chatId } });
      if (!found) throw new NotFoundException('세션을 찾을 수 없습니다.');
      session = found;
    } else {
      session = await this.sessionRepo.save(
        this.sessionRepo.create({
          student_id: studentId,
          name: `${result.subject} 문제풀이`,
        }),
      );
    }

    await this.messageRepo.save(
      this.messageRepo.create({
        chat_id: session.chat_id,
        sender: 'student',
        content: dto.message ?? '[이미지 문제 풀이 요청]',
      }),
    );

    await this.messageRepo.save(
      this.messageRepo.create({
        chat_id: session.chat_id,
        sender: 'ai',
        content: result.solution,
      }),
    );

    return { ...baseResponse, chatId: session.chat_id };
  }

  async followup(dto: FollowupRequestDto): Promise<FollowupResponseDto> {
    const session = await this.sessionRepo.findOne({
      where: { chat_id: dto.chatId },
    });
    if (!session) throw new NotFoundException('세션을 찾을 수 없습니다.');

    const subjectFromName = KNOWN_SUBJECTS.find((s) => session.name.startsWith(s));

    const dbMessages = await this.messageRepo.find({
      where: { chat_id: dto.chatId },
      order: { send_at: 'ASC' },
    });

    const conversationHistory: ConversationEntry[] = dbMessages.map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    const result = await this.graph.invoke({
      image: '',
      mimeType: '',
      subject: subjectFromName ?? '',
      userMessage: dto.message,
      conversationHistory,
    });

    await this.messageRepo.save(
      this.messageRepo.create({
        chat_id: dto.chatId,
        sender: 'student',
        content: dto.message,
      }),
    );

    await this.messageRepo.save(
      this.messageRepo.create({
        chat_id: dto.chatId,
        sender: 'ai',
        content: result.solution,
      }),
    );

    return {
      chatId: dto.chatId,
      solution: result.solution,
      conceptTags: result.conceptTags,
      confidence: result.confidence,
    };
  }

  async getSessions(studentId: number): Promise<SessionDto[]> {
    const sessions = await this.sessionRepo.find({
      where: { student_id: studentId },
      order: { created_at: 'DESC' },
    });
    return sessions.map((s) => ({
      chatId: s.chat_id,
      name: s.name,
      createdAt: s.created_at,
    }));
  }

  async getMessages(chatId: number): Promise<MessageDto[]> {
    const messages = await this.messageRepo.find({
      where: { chat_id: chatId },
      order: { send_at: 'ASC' },
    });
    return messages.map((m) => ({
      messageId: m.message_id,
      sender: m.sender,
      content: m.content,
      sendAt: m.send_at,
    }));
  }
}
