import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppCTA: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <a 
        href="https://wa.me/6512345678" // Replace with real number
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 bg-[#ee3238] hover:bg-[#d42027] text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
      >
        <MessageCircle size={24} />
        <span>Speak to a Mortgage Adviser on WhatsApp</span>
      </a>
      <p className="text-center text-xs text-slate-400 mt-3">
        Complex case? Our human experts at The Loan Connection can help.
      </p>
    </div>
  );
};

export default WhatsAppCTA;