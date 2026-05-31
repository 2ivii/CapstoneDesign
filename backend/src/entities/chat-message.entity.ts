import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  message_id: string;

  @Column()
  chat_id: string;

  @Column({ length: 20 })
  sender: string;

  @CreateDateColumn()
  send_at: Date;

  @Column('text')
  content: string;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  @JoinColumn({ name: 'chat_id' })
  chat_session: ChatSession;
}