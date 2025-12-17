import React, { useState, FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., I need a loan for a 700k HDB..."
          disabled={disabled || isLoading}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03a9e7] focus:border-transparent text-[#052d4a] placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className="px-4 py-2 bg-[#052d4a] text-white rounded-lg hover:bg-[#03a9e7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[3rem]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default InputArea;