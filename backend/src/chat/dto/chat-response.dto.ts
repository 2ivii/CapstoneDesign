export interface SolveResponseDto {
  chatId?: number;
  subject: string;
  solution: string;
  conceptTags: string[];
  confidence: 'high' | 'medium' | 'low';
  problemCount: number;
  isValid: boolean;
  errorMessage: string;
}

export interface FollowupResponseDto {
  chatId: number;
  solution: string;
  conceptTags: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface SessionDto {
  chatId: number;
  name: string;
  createdAt: Date;
}

export interface MessageDto {
  messageId: number;
  sender: string;
  content: string;
  sendAt: Date;
}
