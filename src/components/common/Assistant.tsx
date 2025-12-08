
import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiPaperclip, FiArrowDown } from 'react-icons/fi';
import { getAdminInsights } from '../../services/geminiService'; // Use the direct frontend service
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Action {
  type: string;
  payload?: any;
}

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: Action) => void;
  userData: any; // Data from the parent component
}

const Assistant: React.FC<AssistantProps> = ({ isOpen, onClose, onAction, userData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'model', parts: [{ text: "Hello! I'm your admin assistant. How can I help you analyze the platform's data today?" }] },
      ]);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    const container = messageContainerRef.current;
    if (container) {
      const handleScroll = () => {
        const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50; // Add a 50px buffer
        setShowScrollButton(!isScrolledToBottom);
      };
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', parts: [{ text: input }] }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Use the direct frontend service instead of calling the backend
      const response = await getAdminInsights(input, messages, userData);

      if (response) {
        setMessages([...newMessages, { role: 'model', parts: [{ text: response.text }] }]);
        if (response.action && response.action.type !== 'NONE') {
          onAction(response.action);
        }
      } else {
        throw new Error('Received an empty response from the AI service.');
      }
    } catch (error: any) {
      console.error("Error calling AI service:", error);
      setMessages([...newMessages, { role: 'model', parts: [{ text: `Sorry, something went wrong. ${error.message}` }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This part is more complex and would require sending file data to the service
    console.log('File selected:', event.target.files);
    // You would typically read the file here and send it with the next message
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl z-50 flex flex-col h-[600px]">
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white rounded-t-lg">
        <h3 className="font-bold text-lg flex items-center"><FiMessageSquare className="mr-2" /> AI Assistant</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300"><FiX size={20} /></button>
      </div>
      
      <div ref={messageContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <Markdown>{msg.parts[0].text}</Markdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start my-2">
            <div className="rounded-lg px-4 py-2 max-w-xs bg-gray-200 text-gray-800 italic">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button onClick={scrollToBottom} className="absolute bottom-24 right-8 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600">
          <FiArrowDown size={20} />
        </button>
      )}

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask something..."
            className="flex-1 border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <label htmlFor="file-upload" className="ml-2 p-2 rounded-full hover:bg-gray-200 cursor-pointer">
            <FiPaperclip size={20} className="text-gray-600" />
          </label>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
          <button onClick={handleSend} disabled={isLoading} className="ml-2 p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400">
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
