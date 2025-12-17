import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
          isBot ? 'bg-[#052d4a] text-white mr-3' : 'bg-[#ee3238] text-white ml-3'
        }`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
          isBot 
            ? 'bg-white text-[#052d4a] border border-slate-100 rounded-tl-none' 
            : 'bg-[#ee3238] text-white rounded-tr-none'
        }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;