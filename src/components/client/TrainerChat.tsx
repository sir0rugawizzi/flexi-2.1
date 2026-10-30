import React, { useState, useEffect } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { formatKampalaDateTime } from '../../utils/formatters';

export const TrainerChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text.trim() }),
      });

      if (res.ok) {
        setText('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12 animate-fade-in">
      {/* Coach Header */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#202020] border border-[#333] flex items-center justify-center font-bold text-[#FF6A00]">
            B
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Coach Brian Mukasa</h2>
            <span className="text-[11px] text-emerald-400">Online · Kampala</span>
          </div>
        </div>
        <span className="text-xs text-slate-400">Asynchronous Thread</span>
      </div>

      {/* Messages Feed */}
      <div className="h-96 overflow-y-auto space-y-3 p-4 bg-[#0E0E0E] rounded-3xl border border-[#222222]">
        {messages.map((m) => {
          const isMe = m.sender_id !== 'trainer-brian-01';
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-[#FF6A00] text-white rounded-tr-none'
                    : 'bg-[#1C1C1C] text-slate-100 rounded-tl-none border border-[#2E2E2E]'
                }`}
              >
                <p>{m.content}</p>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                {formatKampalaDateTime(m.created_at)}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && !loading && (
          <p className="text-center text-xs text-slate-500 py-20">
            No messages yet. Send Coach Brian a question about your workouts or Ugandan food swaps!
          </p>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask Coach Brian about workouts, form, or food portions..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#141414] border border-[#2B2B2B] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
