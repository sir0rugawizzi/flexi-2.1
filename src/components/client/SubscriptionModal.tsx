import React, { useState } from 'react';
import { CreditCard, X, CheckCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { formatUGX, formatKampalaDateTime } from '../../utils/formatters';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscribed }) => {
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('0772111222');
  const [planType, setPlanType] = useState<'monthly' | 'quarterly'>('monthly');

  const [step, setStep] = useState<'input' | 'prompt' | 'receipt'>('input');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  if (!isOpen) return null;

  const amountUGX = planType === 'quarterly' ? 240000 : 90000;

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setStep('prompt');
    setSimulating(true);

    // Simulate 2-second USSD push prompt delay on the client's phone
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('flexifit_token');
        const res = await fetch('/api/client/subscriptions/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            network,
            phone_number: phoneNumber,
            plan_type: planType,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          setReceiptData(json.receipt);
          setStep('receipt');
          onSubscribed();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSimulating(false);
      }
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#141414] border border-[#2B2B2B] p-6 text-slate-100 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#FF6A00]" />
            <h3 className="font-extrabold text-base text-white">FlexiFit Mobile Money</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Production Mobile Money Channel Notice */}
        <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2E2E2E] text-slate-300 text-xs flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#FF6A00]" />
            <span>Instant USSD Push Notification</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
            MTN & Airtel MoMo
          </span>
        </div>

        {/* STEP 1: Phone & Network Selection */}
        {step === 'input' && (
          <form onSubmit={handleStartSimulation} className="space-y-4 text-xs">
            {/* Plan Tier Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Select Subscription Plan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlanType('monthly')}
                  className={`p-3 rounded-2xl border text-left transition-colors ${
                    planType === 'monthly'
                      ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="block font-bold">Monthly Coaching</span>
                  <span className="block font-mono text-[#FF6A00] text-sm mt-0.5">{formatUGX(90000)}</span>
                  <span className="text-[10px] text-slate-500">Billed monthly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('quarterly')}
                  className={`p-3 rounded-2xl border text-left transition-colors ${
                    planType === 'quarterly'
                      ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="block font-bold">Quarterly Saver</span>
                  <span className="block font-mono text-[#FF6A00] text-sm mt-0.5">{formatUGX(240000)}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Save UGX 30,000</span>
                </button>
              </div>
            </div>

            {/* Mobile Network Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Mobile Telecom Network</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNetwork('MTN')}
                  className={`py-3 rounded-2xl border font-bold text-center transition-colors ${
                    network === 'MTN'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-400'
                  }`}
                >
                  MTN Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork('AIRTEL')}
                  className={`py-3 rounded-2xl border font-bold text-center transition-colors ${
                    network === 'AIRTEL'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-slate-400'
                  }`}
                >
                  Airtel Money
                </button>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Enter Mobile Number (Uganda)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="e.g. 0772 111 222 or 0702 333 444"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm shadow-xl shadow-[#FF6A00]/20 transition-all cursor-pointer"
            >
              Pay {formatUGX(amountUGX)} via {network} MoMo
            </button>
          </form>
        )}

        {/* STEP 2: Simulated USSD Pin Prompt Screen */}
        {step === 'prompt' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00] flex items-center justify-center text-[#FF6A00] mx-auto animate-pulse">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-extrabold text-lg text-white">USSD Push Dispatched</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Awaiting PIN authorization on <strong>{phoneNumber}</strong> ({network} Mobile Money)...
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#333] max-w-xs mx-auto text-[11px] font-mono text-amber-300">
              [MoMo Prompt] Approve payment of {formatUGX(amountUGX)} to FlexiFit Uganda Merchant? Enter PIN: ****
            </div>
          </div>
        )}

        {/* STEP 3: Printable/Viewable Electronic Receipt */}
        {step === 'receipt' && receiptData && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-1">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-300">Subscription Active!</h4>
              <p className="text-[11px] text-slate-400">Your coaching access has been unlocked.</p>
            </div>

            {/* Receipt Box */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-[#2B2B2B] text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-400 border-b border-[#282828] pb-1.5">
                <span>Receipt Number:</span>
                <span className="text-white font-bold">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Merchant:</span>
                <span className="text-white">{receiptData.merchant}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network:</span>
                <span className="text-white">{receiptData.network} MoMo</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subscriber:</span>
                <span className="text-white">{receiptData.phone_number}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reference ID:</span>
                <span className="text-[#FF6A00] font-bold">{receiptData.reference_id}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-[#282828] pt-1.5 text-sm">
                <span className="font-bold text-white">Amount Paid:</span>
                <span className="font-black text-emerald-400">{formatUGX(receiptData.amount_ugx)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#262626] hover:bg-[#333] text-white font-bold text-xs transition-colors"
            >
              Done & Return to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
