import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  chat_id: string;

  @Column()
  student_id: string;

  @Column({ length: 100 })
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Student, (student) => student.chat_sessions)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => ChatMessage, (message) => message.chat_session)
  messages: ChatMessage[];
}