import React from 'react';
import { MortgagePackage } from '../types';

interface PackageListProps {
  packages: MortgagePackage[];
}

// Helper to clean and split raw text (handles <br>, \n, ;)
const parseContent = (content: string | null): string[] => {
  if (!content) return [];
  // Split by <br>, <br/>, literal \n, actual newline, or semicolon
  return content
    .split(/(?:<br\s*\/?>|\\n|\n|;)/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const PackageCard: React.FC<PackageListProps> = ({ packages }) => {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-sm text-slate-500 font-medium mb-2 uppercase tracking-wide">
        Recommended Packages
      </div>
      
      {packages.map((pkg) => (
        <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-6">
          
          {/* Minimum Loan Size Section */}
          <div className="mb-4">
            <div className="text-sm text-slate-500 font-medium mb-1">Minimum Loan Size</div>
            <div className="text-2xl font-bold text-[#052d4a]">
              ${pkg.min_loan_size.toLocaleString()}
            </div>
          </div>

          {/* Title Section */}
          <h3 className="text-lg md:text-xl font-bold text-[#052d4a] mb-6">
            {pkg.bank} - {pkg.package_name}
          </h3>

          {/* Interest Rates Section */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-[#052d4a] mb-3">Interest Rates</h4>
            <div className="space-y-2">
              {parseContent(pkg.rates).map((line, index) => (
                <div key={index} className="text-[#03a9e7] font-medium text-sm md:text-base">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Key Features Section */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-[#052d4a] mb-3">Key Features</h4>
            <ul className="list-disc pl-5 space-y-2">
              {parseContent(pkg.features).map((line, index) => (
                <li key={index} className="text-slate-600 text-sm leading-relaxed">
                  {line}
                </li>
              ))}
              {/* Merge subsidies into features list if they exist */}
              {parseContent(pkg.subsidies).map((line, index) => (
                 <li key={`sub-${index}`} className="text-slate-600 text-sm leading-relaxed">
                   {line}
                 </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
            Updated: {new Date(pkg.last_updated).toLocaleDateString('en-GB')}
          </div>

        </div>
      ))}
    </div>
  );
};

export default PackageCard;