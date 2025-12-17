import React from 'react';
import { Shield, TrendingUp } from 'lucide-react';
import { RatePreference } from '../types';

interface DirectionCardProps {
  onSelect: (pref: RatePreference) => void;
}

const DirectionCard: React.FC<DirectionCardProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Option A: Stability */}
      <button 
        onClick={() => onSelect(RatePreference.FIXED)}
        className="flex-1 bg-white border border-slate-200 hover:border-[#ee3238] hover:shadow-md hover:ring-1 hover:ring-[#ee3238] rounded-xl p-6 text-left transition-all group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-100 text-[#052d4a] rounded-lg group-hover:bg-[#03a9e7] group-hover:text-white transition-colors">
            <Shield size={24} />
          </div>
          <h3 className="font-semibold text-[#052d4a]">Prioritize Stability</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          I want to pay a fixed amount every month for the next few years, regardless of market fluctuations.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <span className="font-medium text-[#052d4a]">Trade-off:</span> Rates are slightly higher now to pay for this certainty.
        </div>
      </button>

      {/* Option B: Flexibility */}
      <button 
        onClick={() => onSelect(RatePreference.FLOATING)}
        className="flex-1 bg-white border border-slate-200 hover:border-[#ee3238] hover:shadow-md hover:ring-1 hover:ring-[#ee3238] rounded-xl p-6 text-left transition-all group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-100 text-[#052d4a] rounded-lg group-hover:bg-[#03a9e7] group-hover:text-white transition-colors">
            <TrendingUp size={24} />
          </div>
          <h3 className="font-semibold text-[#052d4a]">Maximize Flexibility</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          I want the lowest possible rate today and I can accept my monthly payments changing if the market shifts.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <span className="font-medium text-[#052d4a]">Trade-off:</span> If interest rates rise, your monthly instalment increases immediately.
        </div>
      </button>

    </div>
  );
};

export default DirectionCard;