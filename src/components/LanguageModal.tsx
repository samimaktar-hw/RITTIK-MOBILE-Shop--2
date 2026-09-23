import React from 'react';
import { LanguageCode } from '../types';
import { Globe, X, Check } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectLang
}) => {
  if (!isOpen) return null;

  const options: { code: LanguageCode; flag: string; title: string; subtitle: string }[] = [
    {
      code: 'en',
      flag: '🇬🇧',
      title: 'English',
      subtitle: 'Default International'
    },
    {
      code: 'bn',
      flag: '🇮🇳',
      title: 'বাংলা (Bengali)',
      subtitle: 'পশ্চিমবঙ্গ ও আসাম'
    },
    {
      code: 'hi',
      flag: '🇮🇳',
      title: 'हिन्दी (Hindi)',
      subtitle: 'भारत'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100">Select Language</h3>
            <p className="text-xs text-slate-400">Choose your preferred viewing language</p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 my-4">
          {options.map((opt) => {
            const isSelected = currentLang === opt.code;
            return (
              <div
                key={opt.code}
                onClick={() => {
                  onSelectLang(opt.code);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.flag}</span>
                  <div>
                    <div className="font-bold text-sm leading-snug">{opt.title}</div>
                    <div className="text-[11px] text-slate-400">{opt.subtitle}</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-700'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};
