import RobotProfileImage from '../assets/robot.png';
import UserProfileImage from '../assets/user.png';
import type { Sender } from '../types';
import './ChatMessage.css';

type ChatMessageProps = {
  message: string;
  sender: Sender;
};

export function ChatMessage({ message, sender }: ChatMessageProps) {
  return (
    <div className={sender === 'user' ? 'chat-message-user' : 'chat-message-robot'}>
      {sender === 'robot' && (
        <img src={RobotProfileImage} className="chat-message-profile" alt="Chatbot" />
      )}
      <div className="chat-message-text">{message}</div>
      {sender === 'user' && (
        <img src={UserProfileImage} className="chat-message-profile" alt="You" />
      )}
    </div>
  );
}
