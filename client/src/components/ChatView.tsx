import React, { useState } from 'react';
import { Send, MessageSquare, CheckCheck, Phone, Video } from 'lucide-react';
import { IConversation, IMessage, IUser } from '../types';

interface ChatViewProps {
  conversations: IConversation[];
  activeConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  messages: IMessage[];
  currentUser: IUser;
  onSendMessage: (conversationId: string, content: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  messages,
  currentUser,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    onSendMessage(activeConv.id, inputText.trim());
    setInputText('');
  };

  const quickPhrases = [
    'What time is soundcheck?',
    'I will bring my full audio setup.',
    'Looking forward to performing tonight!',
    'Is parking provided for equipment load-in?',
  ];

  return (
    <div className="bg-white border border-[#1a1a1a]/15 overflow-hidden h-[75vh] flex flex-col md:flex-row">
      {/* Sidebar / Conversation List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#1a1a1a]/10 flex flex-col bg-[#f2efeb]/40">
        <div className="p-4 border-b border-[#1a1a1a]/10 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[#1a1a1a]">Direct Messages</h2>
            <span className="font-mono text-[0.7rem] uppercase tracking-wider px-2 py-0.5 border border-[#1a1a1a]/20 text-[#1a1a1a]/70">
              {conversations.length} Active
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1a1a1a]/8">
          {conversations.map((conv) => {
            const isSelected = conv.id === (activeConv?.id);
            return (
              <div
                key={conv.id}
                id={`conv-item-${conv.id}`}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-white border-l-2 border-[#1a1a1a]' : 'hover:bg-white/60'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      conv.partner?.avatarUrl ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face'
                    }
                    alt={conv.partner?.name || 'Partner'}
                    className="w-11 h-11 object-cover border border-[#1a1a1a]/15 bg-[#e6e2dc]"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#5c62d6] ring-2 ring-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold text-[#1a1a1a] truncate">
                      {conv.partner?.name || 'Performer'}
                    </h3>
                    <span className="font-mono text-[10px] text-[#1a1a1a]/40">Today</span>
                  </div>

                  <p className="font-sans text-xs text-[#1a1a1a]/60 truncate mt-0.5">
                    {conv.lastMessage || 'Open chat thread'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Active Header */}
          <div className="p-4 border-b border-[#1a1a1a]/10 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <img
                src={
                  activeConv.partner?.avatarUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=face'
                }
                alt={activeConv.partner?.name}
                className="w-9 h-9 object-cover border border-[#1a1a1a]/15 bg-[#e6e2dc]"
              />
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#1a1a1a]">{activeConv.partner?.name}</h3>
                <p className="font-mono text-[11px] text-[#1a1a1a]/50">
                  {activeConv.partner?.role || 'Verified Performer'} · <span className="text-[#5c62d6] font-medium">Active now</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#1a1a1a]/60">
              <button className="p-2 border border-[#1a1a1a]/15 hover:border-[#1a1a1a] text-[#1a1a1a] transition-colors cursor-pointer">
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 border border-[#1a1a1a]/15 hover:border-[#1a1a1a] text-[#1a1a1a] transition-colors cursor-pointer">
                <Video className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#f2efeb]/20">
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id || msg.senderId === 'user-org-1';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 text-xs font-sans leading-relaxed ${
                      isMine
                        ? 'bg-[#1a1a1a] text-white shadow-xs'
                        : 'bg-white text-[#1a1a1a] border border-[#1a1a1a]/15 shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[#1a1a1a]/40 mt-1 px-1">
                    <span>{msg.createdAt}</span>
                    {isMine && <CheckCheck className="w-3 h-3 text-[#5c62d6]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick phrase chips */}
          <div className="px-4 py-2.5 border-t border-[#1a1a1a]/8 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none">
            {quickPhrases.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => setInputText(phrase)}
                className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider border border-[#1a1a1a]/15 text-[#1a1a1a]/70 hover:border-[#1a1a1a] hover:text-[#1a1a1a] whitespace-nowrap transition-colors shrink-0 cursor-pointer bg-white"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#1a1a1a]/10 bg-white flex items-center gap-2">
            <input
              type="text"
              id="chat-message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeConv.partner?.name || 'artist'}...`}
              className="flex-1 px-4 py-2.5 text-xs bg-white border border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none text-[#1a1a1a] font-sans"
            />
            <button
              type="submit"
              id="chat-send-btn"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#5c62d6] disabled:opacity-30 text-white transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white text-[#1a1a1a]/40">
          <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
          <p className="font-serif text-xl">Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  );
};
