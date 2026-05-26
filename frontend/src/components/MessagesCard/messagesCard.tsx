// components/MessagesCard.tsx
import React from 'react';

interface Message {
  id: string | number;
  sender: string;
  time: string;
  text: string;
}

interface MessagesCardProps {
  title?: string;
  messages: Message[];
}

const MessagesCard: React.FC<MessagesCardProps> = ({ title = 'Messages', messages }) => {
  return (
    <div className="bg-white p-4 h-[293px] mt-2 rounded-2xl shadow-sm font-sans max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-teal-800">{title}</h2>
        <a href="#" className="text-sm text-gray-500 hover:underline">
          View All
        </a>
      </div>

      {/* Messages list */}
      <ul className="space-y-4 overflow-auto hide-scrollbar h-56">
        {messages?.slice(0, 3).map((msg, idx: number) => (
          <li key={msg.id || idx} className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>

            {/* Message content */}
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{msg.sender}</span>
                <span className="text-xs text-gray-500">{msg.time}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{msg.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MessagesCard;
