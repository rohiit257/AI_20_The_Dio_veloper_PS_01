import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { messageFadeIn } from '../utils/animations';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  animate?: boolean;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp = new Date(),
  animate = true,
  showTimestamp = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedTime = timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  // Check if message is long and should be truncated
  const isLongMessage = message.length > 300;
  const displayMessage = isLongMessage && !isExpanded 
    ? `${message.slice(0, 300)}...` 
    : message;

  // Message container styling based on sender (user or AI)
  const containerClasses = isUser
    ? 'self-end bg-blue-500 text-white'
    : 'self-start bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white';

  // Tail styling based on sender
  const tailClasses = isUser
    ? 'right-0 bg-blue-500'
    : 'left-0 bg-gray-200 dark:bg-gray-700';

  // Base styles for the message bubble
  const baseClasses = 'relative rounded-2xl px-4 py-3 max-w-[85%] shadow-sm';
  
  // When typing animation is active, we'll wrap the text in a container
  const isTypingAnimation = !isUser && animate;

  const messageContent = (
    <>
      <div className={`${isTypingAnimation ? 'overflow-hidden' : ''}`}>
        {isTypingAnimation ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 * (message.length / 20), ease: 'linear' }}
            className="whitespace-pre-wrap"
          >
            {displayMessage}
          </motion.div>
        ) : (
          <div className="whitespace-pre-wrap">{displayMessage}</div>
        )}
      </div>
      
      {isLongMessage && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs mt-1 hover:underline focus:outline-none opacity-80"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
      
      {showTimestamp && (
        <div className={`text-xs mt-1 opacity-60 ${isUser ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
          {formattedTime}
        </div>
      )}
    </>
  );

  return animate ? (
    <motion.div
      className={`${baseClasses} ${containerClasses}`}
      variants={messageFadeIn}
      initial="initial"
      animate="animate"
    >
      {messageContent}
      <div className={`absolute bottom-0 ${isUser ? '-right-2' : '-left-2'} transform translate-y-1/2 rotate-45 w-4 h-4 ${tailClasses}`}></div>
    </motion.div>
  ) : (
    <div className={`${baseClasses} ${containerClasses}`}>
      {messageContent}
      <div className={`absolute bottom-0 ${isUser ? '-right-2' : '-left-2'} transform translate-y-1/2 rotate-45 w-4 h-4 ${tailClasses}`}></div>
    </div>
  );
};

export default MessageBubble; 