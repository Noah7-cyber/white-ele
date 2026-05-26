'use client';

import { MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';

type ChatBubbleProps = {
  sender: boolean;
  name?: string;
  role?: string;
  time: string;
  message: string;
  profile?: string;
  status?: 'waiting' | 'sent' | 'received' | 'read';
};

const generateMessageId = (time: string, name: string | undefined) =>
  `${time}-${name ?? 'anonymous'}-${Math.random().toString(36).slice(2, 9)}`;

export const ChatBubble = ({
  sender,
  name,
  role,
  time,
  message,
  profile,
  status = 'sent',
}: ChatBubbleProps) => {
  const messageDate = new Date(time);
  const isValidDate = !isNaN(messageDate.getTime());

  return (
    <MessageBox
      id={generateMessageId(time, name)}
      position={sender ? 'right' : 'left'}
      type="text"
      title={sender ? '' : (name ?? 'Anonymous')}
      text={message}
      date={isValidDate ? messageDate : new Date()}
      avatar={sender ? undefined : profile}
      titleColor="#374151"
      status={status}
      notch={true}
      retracted={false}
      focus={false}
      forwarded={false}
      replyButton={false}
      removeButton={false}
      data-role={role}
    />
  );
};
