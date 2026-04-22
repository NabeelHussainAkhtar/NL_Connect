import { Supadata } from '@supadata/js'

export interface YouTubeSearchResult {
  videoId: string
  title: string
  thumbnail: string
  channelTitle: string
  isLocal?: boolean
  localUrl?: string
}

const BRIDGE_URL = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/youtube/search'

const supadata = new Supadata({
  apiKey: import.meta.env.VITE_SUPADATA_API_KEY,
})

export async function searchYouTube(query: string, categoryId: string = '10'): Promise<YouTubeSearchResult[]> {
  // 1. Try Supadata (Primary)
  try {
    const results = await supadata.youtube.search({
      query,
      type: 'video',
      limit: 20,
    })
    
    if (results && results.results && results.results.length > 0) {
      return results.results.map((item: any) => ({
        videoId: item.id,
        title: item.title,
        thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : (item.thumbnail?.url || item.thumbnails?.[0]?.url),
        channelTitle: item.channel?.name || item.author || 'YouTube'
      }))
    }
  } catch (err) {
    console.warn('[Supadata Search Error]', err)
  }

  // 2. Try Bridge Worker (Fallback)
  try {
    const url = new URL(BRIDGE_URL)
    url.searchParams.set('q', query)
    if (categoryId !== 'all') url.searchParams.set('videoCategoryId', categoryId)

    const cookie = import.meta.env.VITE_YOUTUBE_COOKIE || ''
    const res = await fetch(url.toString(), {
      headers: {
        'x-youtube-cookie': cookie
      }
    })
    if (res.ok) {
      const data = await res.json() as YouTubeSearchResult[]
      if (data && data.length > 0) return data
    }
  } catch (err) {
    console.warn('[YouTube Bridge Error]', err)
  }

  // Direct search fallback using client-side API key
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (apiKey && apiKey !== 'YOUR_YT_API_KEY') {
    try {
      const search = async (catId?: string) => {
        const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search')
        ytUrl.searchParams.set('part', 'snippet')
        ytUrl.searchParams.set('type', 'video')
        if (catId && catId !== 'all') ytUrl.searchParams.set('videoCategoryId', catId)
        ytUrl.searchParams.set('q', query)
        ytUrl.searchParams.set('maxResults', '20')
        ytUrl.searchParams.set('key', apiKey)
        const ytRes = await fetch(ytUrl.toString())
        return await ytRes.json()
      }

      let ytData = await search(categoryId)
      
      // If no results with category filter, try without it
      if ((!ytData.items || ytData.items.length === 0) && categoryId !== 'all') {
        console.log('[YouTube Fallback] No results with cat filter, retrying without...')
        ytData = await search()
      }

      if (ytData.items && ytData.items.length > 0) {
        return ytData.items.map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle
        }))
      }
    } catch (fallbackErr) {
      console.error('[YouTube Direct Fallback Error]', fallbackErr)
    }
  }
  
  const mock = getMockTracks()
  const filtered = mock.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase())
  )
  return filtered.length > 0 ? filtered : mock
}

/**
 * Fetches comprehensive metadata for a YouTube video using Supadata
 */
export async function getTrackDetails(videoId: string) {
  try {
    const metadata = await supadata.metadata({
      url: `https://www.youtube.com/watch?v=${videoId}`,
    })
    return metadata
  } catch (err) {
    console.error('[Supadata Metadata Error]', err)
    return null
  }
}

/** Fetches real-time search suggestions from YouTube's public suggest API */
export async function getYouTubeSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`)
    const data = await res.json()
    return data[1] || []
  } catch {
    return []
  }
}

export function getMockTracks(): YouTubeSearchResult[] {
  return [
    { videoId: 'JGwWNGJdvx8', title: 'Shape of You',          channelTitle: 'Ed Sheeran',     thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
    { videoId: 'ktvTqknDobU', title: 'Radioactive',            channelTitle: 'Imagine Dragons', thumbnail: 'https://img.youtube.com/vi/ktvTqknDobU/mqdefault.jpg' },
    { videoId: 'hT_nvWreIhg', title: 'Counting Stars',         channelTitle: 'OneRepublic',    thumbnail: 'https://img.youtube.com/vi/hT_nvWreIhg/mqdefault.jpg' },
    { videoId: 'OPf0YbXqDm0', title: 'Mark Ronson - Uptown Funk', channelTitle: 'Mark Ronson', thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/mqdefault.jpg' },
    { videoId: 'CevxZvSJLk8', title: 'Katy Perry - Roar',     channelTitle: 'Katy Perry',     thumbnail: 'https://img.youtube.com/vi/CevxZvSJLk8/mqdefault.jpg' },
    { videoId: 'RgKAFK5djSk', title: 'Wiz Khalifa - See You Again', channelTitle: 'Wiz Khalifa', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/mqdefault.jpg' },
  ]
}
