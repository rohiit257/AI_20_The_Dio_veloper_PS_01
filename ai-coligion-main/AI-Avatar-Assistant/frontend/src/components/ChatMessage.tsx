'use client';

import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  videoUrl?: string;  // Video URL for AI avatar rendering
  onSpeak?: (url: string) => void; // Function to trigger avatar rendering
}

export default function ChatMessage({ message, isUser, timestamp = new Date(), videoUrl, onSpeak }: ChatMessageProps) {
  const [timeAgo, setTimeAgo] = useState<string>(formatDistanceToNow(timestamp, { addSuffix: true }));
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Update time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeAgo(formatDistanceToNow(timestamp, { addSuffix: true }));
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [timestamp]);

  // Apply slide-in animation
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.classList.add('opacity-100', 'translate-y-0');
    }
  }, []);

  // Format message content
  const formattedMessage = message.split('```').map((part, index) => {
    if (index % 2 === 1) {
      // Code block
      const [language, ...code] = part.split('\n');
      return (
        <div key={index} className="relative mt-2 mb-4 rounded-md bg-gray-100 dark:bg-gray-800 overflow-x-auto">
          {language && (
            <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 rounded-t-md">
              {language}
            </div>
          )}
          <pre className="p-4 text-sm font-mono">{code.join('\n')}</pre>
        </div>
      );
    } else {
      // Regular text, links, headers, and lists
      return part.split('\n').map((line, lineIndex) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const formattedLine = line.replace(
          linkRegex,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
        );

        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <p key={`${index}-${lineIndex}`} className="my-1 flex">
              <span className="inline-block w-4 text-gray-400 dark:text-gray-500">•</span>
              <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[- *]\s/, '') }} />
            </p>
          );
        }

        if (line.trim().startsWith('# ')) {
          return <h2 key={`${index}-${lineIndex}`} className="text-xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^#\s+/, '') }} />;
        }

        if (line.trim().startsWith('## ')) {
          return <h3 key={`${index}-${lineIndex}`} className="text-lg font-bold mt-3 mb-2" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^##\s+/, '') }} />;
        }

        const numberMatch = line.trim().match(/^(\d+)\.\s(.+)$/);
        if (numberMatch) {
          return (
            <p key={`${index}-${lineIndex}`} className="my-1 flex">
              <span className="inline-block w-5 text-gray-400 dark:text-gray-500">{numberMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: numberMatch[2] }} />
            </p>
          );
        }

        return (
          <p key={`${index}-${lineIndex}`} className={line.trim() ? 'my-2' : 'my-4'}>
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </p>
        );
      });
    }
  });

  return (
    <div ref={messageRef} className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-300 ease-out transform opacity-0 translate-y-4`}>
      <div className={`max-w-[80%] sm:max-w-[70%] rounded-lg shadow-sm px-4 py-3 ${isUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
        <div className="flex justify-between items-start mb-1">
          <span className={`text-xs font-medium ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className={`text-xs ml-2 ${isUser ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
            {timeAgo}
          </span>
        </div>

        <div className={`prose prose-sm ${isUser ? 'prose-invert' : 'dark:prose-invert'} max-w-none`}>
          {formattedMessage}
        </div>

        {/* Speak Button - Only for AI Messages */}
        {!isUser && videoUrl && (
          <button 
            onClick={() => onSpeak?.(videoUrl)} 
            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Speak
          </button>
        )}
      </div>
    </div>
  );
}
