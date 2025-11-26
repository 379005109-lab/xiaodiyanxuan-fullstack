import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { ChatMessage, Product } from '../types';

interface GeminiChatProps {
  products: Product[];
}

const GeminiChat: React.FC<GeminiChatProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '您好！我是小迪严选的 AI 软装搭配师。想要打造什么风格的绿色自然空间？我可以为您推荐最匹配的家具。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const productContext = products.map(p => 
        `- ${p.name}: ¥${p.price}, 风格: ${p.category}`
      ).join('\n');

      const systemPrompt = `你是一个高端家具品牌“小迪严选”的专业软装设计师。
      我们的品牌特色是“绿色自然、高端轻奢”。
      
      产品目录:
      ${productContext}

      原则:
      1. 用中文回答，语气优雅、专业、热情。
      2. 重点推荐与“绿色”、“自然”、“植物”搭配的产品。
      3. 针对用户的需求推荐具体的产品。
      4. 回答不要过长，保持对话感。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMsg,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const text = response.text || "抱歉，我现在无法连接到设计中心，请稍后再试。";

      setMessages(prev => [...prev, { role: 'model', text }]);

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "网络连接有些问题，请稍后再试。", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Green Theme */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-primary text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-3xl hover:bg-green-900 transition-all transform hover:-translate-y-1 z-50 flex items-center gap-3 group animate-float"
        >
          <div className="relative">
             <Sparkles className="w-5 h-5 text-accent" />
             <div className="absolute inset-0 bg-accent blur-sm opacity-50 animate-pulse"></div>
          </div>
          <span className="font-serif italic text-sm tracking-wide pr-1">AI 搭配师</span>
        </button>
      )}

      {/* Chat Window - Glassmorphism & Clean */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-80 md:w-96 h-[600px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary/10 z-50 flex flex-col overflow-hidden animate-fade-in-up ring-1 ring-primary/5">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-800 border border-green-700 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
              </div>
              <div>
                  <h3 className="font-serif font-bold tracking-wide">AI Designer</h3>
                  <p className="text-[10px] text-green-200 uppercase tracking-widest">Online Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-green-800 p-1.5 rounded-full transition-colors">
              <X className="w-5 h-5 text-green-200" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-stone-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-stone-200' : 'bg-primary'}`}>
                        {msg.role === 'user' ? <div className="w-2 h-2 bg-stone-500 rounded-full"/> : <Sparkles className="w-3 h-3 text-accent"/>}
                    </div>

                    <div 
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-stone-200 text-stone-800 rounded-br-none' 
                        : msg.isError 
                            ? 'bg-red-50 text-red-600 rounded-bl-none'
                            : 'bg-white text-primary shadow-sm border border-stone-100 rounded-bl-none'
                    }`}
                    >
                    {msg.text}
                    </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start pl-8">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-stone-100">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="询问关于配色、风格的建议..."
                className="w-full bg-stone-50 border border-stone-200 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all text-primary"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-1.5 top-1.5 bg-primary text-white p-2 rounded-full hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiChat;