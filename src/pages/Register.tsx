import { useState, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, X, Loader2, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+92', label: 'PK (+92)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+81', label: 'JP (+81)' },
  { code: '+86', label: 'CN (+86)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+33', label: 'FR (+33)' },
]

export default function Register() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneValue, setPhoneValue] = useState('')
  const [name, setName] = useState(user?.displayName || '')
  const [status, setStatus] = useState('Hey there! I am using N&L Connect.')
  const [avatarObj, setAvatarObj] = useState<{ url: string; key: string } | null>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0) // Visual fake progress for short uploads
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return <Navigate to="/auth" replace />
  if (profile) return <Navigate to="/home" replace />

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be under 5MB.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setUploadProgress(10)
      
      const interval = setInterval(() => {
        setUploadProgress(p => p < 90 ? p + 15 : p)
      }, 100)

      // Upload to Cloudflare Worker R2 endpoint
      const key = `avatar-${user.uid}-${Date.now()}`
      const res = await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/media/upload?key=${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      clearInterval(interval)
      setUploadProgress(100)

      if (!res.ok) throw new Error('Failed to upload image.')
      
      // If there was an old avatar, try to delete it
      if (avatarObj) {
        await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/media/${avatarObj.key}`, { method: 'DELETE' })
      }

      setAvatarObj({
        url: `https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/media/${key}`,
        key
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setTimeout(() => setUploading(false), 500)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!avatarObj) return
    try {
      setUploading(true)
      await fetch(`https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/media/${avatarObj.key}`, { method: 'DELETE' })
      setAvatarObj(null)
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneValue.replace(/\D/g, '')) {
      setError('Please enter a valid phone number.')
      return
    }

    const fullPhone = `${countryCode}${phoneValue.replace(/\D/g, '')}`

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        uid: user.uid,
        phone: fullPhone,
        display_name: name,
        status,
        avatar_url: avatarObj ? avatarObj.url : null
      }

      const res = await fetch('https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.status === 409) {
        throw new Error('This phone number is already registered to another account.')
      }

      if (!res.ok) throw new Error('Registration failed. Please try again.')

      await refreshProfile()
      navigate('/home')

    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex flex-col h-full px-6 overflow-y-auto safe-p-y max-w-sm mx-auto justify-center" style={{ background: 'var(--surface)' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full py-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Create Profile</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Tell us a bit about yourself.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative overflow-hidden w-28 h-28 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-container-high)', border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              
              {avatarObj ? (
                <img src={avatarObj.url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={36} className="opacity-30" />
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-2 z-10">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-auto mb-2">
                    <motion.div className="h-full bg-[var(--accent)]" animate={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <Camera size={14} /> {avatarObj ? 'Change' : 'Upload photo'}
              </button>
              {avatarObj && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 active:scale-95 transition-transform"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {error && <div className="text-sm font-medium text-center p-3 rounded-xl" style={{ color: 'var(--accent-danger)', background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.15)' }}>{error}</div>}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider ml-2" style={{ color: 'var(--text-tertiary)' }}>Phone Number</label>
              <div className="flex overflow-hidden rounded-xl focus-within:ring-2 ring-[var(--accent)] transition-shadow" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="px-2 py-3 font-bold text-sm outline-none border-r cursor-pointer"
                  style={{ background: 'var(--surface-container-high)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="text-black bg-white dark:bg-black dark:text-white">{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phoneValue}
                  onChange={e => setPhoneValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="555 000 0000"
                  className="flex-1 px-4 py-3 bg-transparent text-[15px] outline-none text-[var(--text-primary)]"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider ml-2" style={{ color: 'var(--text-tertiary)' }}>Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none focus:ring-2 ring-[var(--accent)] transition-shadow"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider ml-2" style={{ color: 'var(--text-tertiary)' }}>Status</label>
              <input
                type="text"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none focus:ring-2 ring-[var(--accent)] transition-shadow"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full flex items-center justify-center gap-2 py-4 mt-4 rounded-2xl text-white font-semibold transition-transform active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #4f7dff, #6c63ff)', boxShadow: '0 8px 24px rgba(79,125,255,0.3)' }}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Complete Registration'}
          </button>

        </form>
      </motion.div>
    </div>
  )
}
