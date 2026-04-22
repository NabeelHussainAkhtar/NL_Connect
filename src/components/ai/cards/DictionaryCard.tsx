import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DictionaryData } from '@/lib/ai/tools/dictionary';

const POS_COLORS: Record<string, string> = {
  noun:        'bg-blue-500/20 text-blue-400',
  verb:        'bg-green-500/20 text-green-400',
  adjective:   'bg-purple-500/20 text-purple-400',
  adverb:      'bg-orange-500/20 text-orange-400',
  exclamation: 'bg-pink-500/20 text-pink-400',
  pronoun:     'bg-teal-500/20 text-teal-400',
};

function posColor(pos: string) {
  return POS_COLORS[pos.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
}

export function DictionaryCard({ data }: { data: DictionaryData }) {
  const [playing, setPlaying] = useState(false);

  const playAudio = () => {
    if (!data.audioUrl) return;
    const audio = new Audio(data.audioUrl);
    setPlaying(true);
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'var(--surface)' }}
    >
      {/* Header: word + phonetic */}
      <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-[#4285F4]/10 to-purple-500/5 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }}>
              {data.word}
            </h2>
            {data.phonetic && (
              <p className="text-sm opacity-50 mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {data.phonetic}
              </p>
            )}
          </div>
          {data.audioUrl && (
            <button
              onClick={playAudio}
              className={`p-2.5 rounded-full transition-all ${playing ? 'bg-[#4285F4] text-white animate-pulse' : 'bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20'}`}
            >
              🔊
            </button>
          )}
        </div>
        {data.origin && (
          <p className="text-[10px] mt-2 opacity-40 italic" style={{ color: 'var(--text-primary)' }}>
            Origin: {data.origin}
          </p>
        )}
      </div>

      {/* Meanings */}
      <div className="divide-y divide-white/5">
        {data.meanings.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="px-5 py-4"
          >
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${posColor(m.partOfSpeech)}`}>
              {m.partOfSpeech}
            </span>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{m.definition}</p>
            {m.example && (
              <p className="text-xs mt-1.5 italic opacity-50" style={{ color: 'var(--text-primary)' }}>
                "{m.example}"
              </p>
            )}
            {m.synonyms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.synonyms.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-70">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
