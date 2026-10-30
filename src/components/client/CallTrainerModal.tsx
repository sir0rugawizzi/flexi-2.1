import React, { useState } from 'react';
import { PhoneCall, Video, MessageCircle, X, Send, Calendar, CheckCircle2 } from 'lucide-react';

interface CallTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: {
    name: string;
    phone: string;
    profile?: {
      meet_link?: string;
      zoom_link?: string;
      whatsapp_number?: string;
      preferred_channel?: 'meet' | 'zoom' | 'whatsapp';
    };
  } | null;
}

export const CallTrainerModal: React.FC<CallTrainerModalProps> = ({ isOpen, onClose, trainer }) => {
  const [preferredSlot, setPreferredSlot] = useState('Today (6:00 PM)');
  const [topic, setTopic] = useState('Form Check & Nutrition Adjustment');
  const [selectedChannel, setSelectedChannel] = useState<'meet' | 'zoom' | 'whatsapp'>('meet');
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const meetLink = trainer?.profile?.meet_link || 'https://meet.google.com/new';
  const zoomLink = trainer?.profile?.zoom_link || 'https://zoom.us';
  const rawWhatsApp = trainer?.profile?.whatsapp_number || trainer?.phone || '256701234567';
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, '');
  const whatsAppLink = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello Coach Brian! I would like to schedule our weekly FlexiFit check-in call regarding ${topic}.`
  )}`;

  const handleSendCallRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('flexifit_token');
      const res = await fetch('/api/client/call-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_slot: preferredSlot,
          topic,
          channel: selectedChannel,
        }),
      });

      if (res.ok) {
        setRequestSent(true);
        setTimeout(() => {
          setRequestSent(false);
          onClose();
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send call request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#141414] border border-[#2B2B2B] p-6 text-slate-100 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[#FF6A00]" />
            <h3 className="font-extrabold text-base text-white">Call Coach Brian</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Instant Channels */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 block">Instant Live Channels:</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Google Meet */}
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B] hover:border-[#FF6A00] transition-colors flex items-center gap-3 text-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-950/60 flex items-center justify-center text-blue-400 shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Google Meet</span>
                <span className="text-[10px] text-slate-400">Launch 1-Click Video Room</span>
              </div>
            </a>

            {/* WhatsApp Deep Link */}
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B] hover:border-emerald-500 transition-colors flex items-center gap-3 text-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">WhatsApp Direct</span>
                <span className="text-[10px] text-slate-400">Voice or Chat (+256)</span>
              </div>
            </a>
          </div>
        </div>

        {/* 2. Or Request a Scheduled Call */}
        <div className="pt-2 border-t border-[#222222]">
          <span className="text-xs font-bold text-slate-300 block mb-2">
            Or Request a Scheduled Coaching Slot:
          </span>

          {requestSent ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-emerald-300">Call Request Dispatched!</p>
              <p className="text-[10px] text-slate-400">Coach Brian has received your preferred slot.</p>
            </div>
          ) : (
            <form onSubmit={handleSendCallRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Preferred Time Window</label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                >
                  <option value="Today (6:00 PM)">Today Evening (6:00 PM - 6:30 PM)</option>
                  <option value="Tomorrow (7:00 AM)">Tomorrow Morning (7:00 AM - 7:30 AM)</option>
                  <option value="Tomorrow (6:00 PM)">Tomorrow Evening (6:00 PM - 6:30 PM)</option>
                  <option value="Sunday (11:00 AM)">Sunday Weekly Check-In (11:00 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic / Discussion Goal</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Preferred Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['meet', 'whatsapp', 'zoom'] as const).map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setSelectedChannel(chan)}
                      className={`py-1.5 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                        selectedChannel === chan
                          ? 'bg-[#FF6A00] text-white'
                          : 'bg-[#1C1C1C] text-slate-400 hover:text-white'
                      }`}
                    >
                      {chan}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold transition-colors cursor-pointer"
              >
                {submitting ? 'Sending Request...' : 'Dispatch Call Request to Coach'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
