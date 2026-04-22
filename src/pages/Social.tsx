import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, ExternalLink, Loader2 } from 'lucide-react'
import VirtualList from '@/components/shared/VirtualList'
import { Browser } from '@capacitor/browser'
import FeedCard from '@/modules/social/FeedCard'
import { mockPosts } from '@/lib/mockData'

export default function Social() {
   const [useInstagram, setUseInstagram] = useState(false)
   const [iframeLoading, setIframeLoading] = useState(true)

   if (!useInstagram) {
      return (
         <div className="h-full overflow-hidden flex flex-col items-center pt-8 bg-[var(--surface-sunken)]">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-3xl flex items-center justify-center shadow-lg shadow-pink-500/30 mb-6">
               <Camera size={40} color="white" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Connect Instagram</h2>
            <p className="text-[13px] text-[var(--text-secondary)] text-center px-8 mb-8">
               Login to your official Instagram account natively within N&L Connect. Experience a unified social feed.
            </p>

            <button
               onClick={() => setUseInstagram(true)}
               className="bg-[var(--text-primary)] text-[var(--surface)] font-bold text-sm px-6 py-3 rounded-full active:scale-95 transition-transform"
            >
               Embed Instagram Native
            </button>

            <div className="flex-1 w-full mt-12 bg-[var(--surface)] rounded-t-[40px] pt-4 shadow-[-4px_-10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
               <div className="h-10 border-b border-[var(--border-color)] px-6 flex items-center justify-between font-bold text-xs">
                  <span style={{ color: 'var(--text-primary)' }}>Or view N&L Public Feed</span>
               </div>
               <VirtualList
                  items={mockPosts.map((post) => <FeedCard key={post.id} post={post} />)}
                  itemHeight={440}
                  containerHeight={500}
                  overscan={2}
               />
            </div>
         </div>
      )
   }

   return (
      <div className="h-full w-full relative bg-black/5 flex flex-col">
         <div className="h-12 bg-[var(--surface-raised)] border-b border-[var(--border-color)] flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
               <button onClick={() => setUseInstagram(false)} className="text-xs font-bold bg-[var(--surface-sunken)] px-3 py-1 rounded-full text-[var(--text-primary)]">Back</button>
               <Camera size={16} />
               <span className="font-bold text-xs opacity-50">Instagram Portal</span>
            </div>
            <button
               onClick={async () => {
                  await Browser.open({ url: 'https://instagram.com/' })
               }}
               className="text-xs font-bold text-[var(--accent)] flex items-center gap-1"
            >
               Open App <ExternalLink size={14} />
            </button>
         </div>

         <div className="flex-1 w-full bg-[var(--surface)] relative flex flex-col">
            {/* Instagram Web View with anti-redirect techniques */}
            <div className="flex-1 relative">
               {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-sunken)] z-10">
                     <Loader2 size={32} className="text-[var(--text-tertiary)] animate-spin" />
                  </div>
               )}
               <iframe
                  src="https://www.instagram.com/"
                  className="w-full h-full border-0"
                  title="Instagram"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                  onLoad={() => setIframeLoading(false)}
                  // These techniques help prevent Instagram from redirecting to the app
                  style={{
                     backgroundColor: 'var(--surface)',
                     // Force desktop user agent via CSS won't work, but we can try to trick Instagram
                  }}
               />
            </div>

            {/* Fallback button */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--surface-raised)] flex items-center justify-between">
               <div className="text-xs text-[var(--text-secondary)]">
                  If Instagram redirects to app, try:
               </div>
               <button
                  onClick={async () => {
                     // Open Instagram in a new browser tab with desktop mode flag
                     await Browser.open({
                        url: 'https://www.instagram.com/',
                        windowName: '_blank'
                     })
                  }}
                  className="text-xs font-bold text-[var(--accent)] flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--surface-sunken)]"
               >
                  Open in Browser <ExternalLink size={12} />
               </button>
            </div>
         </div>
      </div>
   )
}
