import { useState, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Activity, Lock, Check, ChevronRight, Zap, Info, AlertCircle } from 'lucide-react'
import { AI_CATALOG, AIModel } from '@/lib/ai-models'

interface ModelSettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentModelId: string
  onSelectModel: (model: AIModel) => void
  usage: Record<string, { requests: number, tokens: number }>
  failedModelIds: Set<string>
}

export const ModelSettingsDrawer = memo(function ModelSettingsDrawer({
  isOpen, onClose, currentModelId, onSelectModel, usage, failedModelIds
}: ModelSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'limits' | 'models' | 'permissions' | 'voice'>('limits')
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(() => localStorage.getItem('nl_ai_voice') || '')

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    
    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices())
    }
    
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const handleSelectVoice = (uri: string) => {
    setSelectedVoiceUri(uri)
    localStorage.setItem('nl_ai_voice', uri)
    
    // Test the voice
    const voice = availableVoices.find(v => v.voiceURI === uri)
    if (voice) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance("Hi, I am Ramsha.")
      u.voice = voice
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0d1017] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <Shield size={20} className="text-[#00f5d4]" />
                  Model Settings
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Management & Capacity</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
              {['limits', 'models', 'permissions', 'voice'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                    activeTab === tab ? 'text-[#00f5d4]' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f5d4]" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {activeTab === 'limits' && (
                <div className="space-y-8">
                  <section>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">Organization Limits</h3>
                        <p className="text-[11px] text-white/40">Base rate limits for your project.</p>
                      </div>
                      <span className="text-[9px] font-black px-2 py-1 bg-[#00f5d4]/10 text-[#00f5d4] rounded-md border border-[#00f5d4]/20">DEVELOPER PLAN</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/40">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">RPM</th>
                            <th className="px-4 py-3">TPM</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-[11px]">
                          {AI_CATALOG.map(m => {
                            const current = usage[m.id] || { requests: 0, tokens: 0 }
                            const isLimitOver = m.limits.rpm > 0 && current.requests >= m.limits.rpm
                            return (
                              <tr key={m.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="px-4 py-3 font-bold text-white/80 group-hover:text-white truncate max-w-[120px]">{m.id.split('/').pop()}</td>
                                <td className="px-4 py-3 text-white/60">{m.limits.rpm}</td>
                                <td className="px-4 py-3 text-white/60">{m.limits.tpm ? (m.limits.tpm / 1000).toFixed(0) + 'K' : '∞'}</td>
                                <td className="px-4 py-3">
                                  {isLimitOver ? (
                                    <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">LIMIT OVER</span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">OK</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'models' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-white">Select Model</h3>
                    <button className="text-[9px] font-black text-[#00f5d4] hover:underline uppercase tracking-widest">Clear Cache</button>
                  </div>
                  {AI_CATALOG.map(model => {
                    const isActive = currentModelId === model.id
                    const currentUsage = usage[model.id] || { requests: 0, tokens: 0 }
                    const isLimitReached = model.limits.rpm > 0 && currentUsage.requests >= model.limits.rpm
                    const isFailed = failedModelIds.has(model.id)
                    const isUnavailable = isLimitReached || isFailed

                    return (
                      <button
                        key={model.id}
                        disabled={isUnavailable}
                        onClick={() => onSelectModel(model)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                          isActive 
                            ? 'bg-[#00f5d4]/10 border-[#00f5d4] shadow-[0_0_20px_rgba(0,245,212,0.1)]' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        } ${isUnavailable ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                      >
                        <div className="flex-1 overflow-hidden pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`p-1.5 rounded-lg ${isActive ? 'bg-[#00f5d4] text-black' : isFailed ? 'bg-red-500 text-white' : 'bg-white/10 text-white/40 group-hover:text-white'}`}>
                              {isFailed ? <AlertCircle size={14} /> : model.type === 'chat' ? <Activity size={14} /> : model.type === 'tts' ? <Zap size={14} /> : <Info size={14} />}
                            </span>
                            <span className="text-sm font-bold truncate text-white">{model.name}</span>
                          </div>
                          <p className="text-[11px] text-white/40 line-clamp-1">{model.description}</p>
                          {isUnavailable && (
                             <p className="text-[10px] text-red-500 font-black mt-1 uppercase tracking-tighter flex items-center gap-1">
                               ⚠️ {isFailed ? 'Model restricted / Error' : 'Capacity reached'}
                             </p>
                          )}
                        </div>
                        {isActive && <Check size={18} className="text-[#00f5d4] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {activeTab === 'permissions' && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-40">
                  <Lock size={48} className="mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Model Permissions</h3>
                  <p className="text-xs max-w-xs leading-relaxed">Enterprise management features are locked for this project. Contact organization admin.</p>
                </div>
              )}

              {activeTab === 'voice' && (() => {
                  const hindiVoices = availableVoices.filter(v => v.lang.startsWith('hi') || v.lang.startsWith('ur'));
                  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
                  const otherVoices = availableVoices.filter(v => !v.lang.startsWith('hi') && !v.lang.startsWith('ur') && !v.lang.startsWith('en'));

                  const VoiceButton = ({ voice }: { voice: SpeechSynthesisVoice }) => {
                    const isActive = selectedVoiceUri === voice.voiceURI;
                    return (
                      <button
                        key={voice.voiceURI}
                        onClick={() => handleSelectVoice(voice.voiceURI)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                          isActive
                            ? 'bg-[#4285F4]/10 border-[#4285F4] shadow-[0_0_20px_rgba(66,133,244,0.1)]'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden pr-2">
                          <p className="text-sm font-semibold truncate text-white">{voice.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{voice.lang} • {voice.localService ? '📴 Offline' : '🌐 Online'}</p>
                        </div>
                        {isActive && <Check size={16} className="text-[#4285F4] shrink-0" />}
                      </button>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      <p className="text-[11px] text-white/40 leading-relaxed">Select the voice Ramsha will use. She'll auto-detect Hindi vs English and pick the right one.</p>

                      {hindiVoices.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                            🇮🇳 Hindi / Urdu Voices ({hindiVoices.length})
                          </p>
                          {hindiVoices.map((v, i) => <VoiceButton key={v.voiceURI || `hi-${i}`} voice={v} />)}
                        </div>
                      )}

                      {englishVoices.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                            🇬🇧 English Voices ({englishVoices.length})
                          </p>
                          {englishVoices.map((v, i) => <VoiceButton key={v.voiceURI || `en-${i}`} voice={v} />)}
                        </div>
                      )}

                      {otherVoices.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Other Languages</p>
                          {otherVoices.map((v, i) => <VoiceButton key={v.voiceURI || `other-${i}`} voice={v} />)}
                        </div>
                      )}

                      {availableVoices.length === 0 && (
                        <div className="text-center py-8 text-white/40 text-xs">No voices found on this device.</div>
                      )}

                      {selectedVoiceUri && (
                        <button
                          onClick={() => { setSelectedVoiceUri(''); localStorage.removeItem('nl_ai_voice'); }}
                          className="w-full text-center text-[10px] text-red-400 hover:underline py-2"
                        >
                          Reset to auto-detect
                        </button>
                      )}
                    </div>
                  );
                })()
              }
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#00f5d4]/5 border border-[#00f5d4]/10">
                <AlertCircle size={16} className="text-[#00f5d4]" />
                <p className="text-[10px] text-white/70 leading-relaxed">
                  <span className="font-bold text-[#00f5d4]">PRO TIP:</span> Use smaller models like <span className="text-white font-bold">Llama 8B</span> for faster responses and lower usage costs.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
