import { Filesystem, Directory } from '@capacitor/filesystem'
import { YouTubeSearchResult } from '@/lib/youtube'

export class LocalLibraryScanner {
  static async scanForMusic(): Promise<YouTubeSearchResult[]> {
    try {
      // Request permission
      const perm = await Filesystem.checkPermissions()
      if (perm.publicStorage !== 'granted') {
        await Filesystem.requestPermissions()
      }

      // On Android, we usually want to look in the 'Music' or 'Download' folders
      // For simplicity, we'll scan the top level of external storage first
      const result = await Filesystem.readdir({
        path: '',
        directory: Directory.External
      })

      const musicFiles: YouTubeSearchResult[] = []

      for (const file of result.files) {
        if (file.type === 'file' && (file.name.endsWith('.mp3') || file.name.endsWith('.m4a') || file.name.endsWith('.wav'))) {
          const uri = await Filesystem.getUri({
            path: file.name,
            directory: Directory.External
          })

          musicFiles.push({
            videoId: `local-${file.name}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            thumbnail: '', // Local files don't have thumbnails easily available without extra parsing
            channelTitle: 'Local Audio',
            isLocal: true,
            localUrl: uri.uri // Use native URI
          })
        }
      }

      return musicFiles
    } catch (e) {
      console.error('Scan failed', e)
      return []
    }
  }

  static async scanFolder(path: string): Promise<YouTubeSearchResult[]> {
    try {
      const result = await Filesystem.readdir({
        path,
        directory: Directory.External
      })

      const musicFiles: YouTubeSearchResult[] = []
      for (const file of result.files) {
         if (file.type === 'file' && (file.name.endsWith('.mp3') || file.name.endsWith('.m4a'))) {
            const uri = await Filesystem.getUri({ path: `${path}/${file.name}`, directory: Directory.External })
            musicFiles.push({
               videoId: `local-${file.name}-${Math.random()}`,
               title: file.name.replace(/\.[^/.]+$/, ""),
               thumbnail: '',
               channelTitle: 'Local Audio',
               isLocal: true,
               localUrl: uri.uri
            })
         }
      }
      return musicFiles
    } catch (e) {
      console.error('Folder scan failed', e)
      return []
    }
  }
}
