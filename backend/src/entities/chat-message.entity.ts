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
  @PrimaryGeneratedColumn('increment')
  message_id: number;

  @Column()
  chat_id: number;

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