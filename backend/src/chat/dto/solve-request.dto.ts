export class SolveRequestDto {
  studentId?: string; // multipart/form-data에서 string으로 전달됨
  chatId?: string;
  subject?: string;
  message?: string;
}
