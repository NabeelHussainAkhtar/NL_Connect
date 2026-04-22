/**
 * N&L Connect — Cloudflare Worker (Full System + Luna)
 */

export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  AI: any
  FIREBASE_SERVICE_ACCOUNT_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_PUBLIC_KEY: string
  GEMINI_API_KEY: string
  YOUTUBE_API_KEY: string
  SERP_API_KEY: string
  COINGECKO_API_KEY: string
  ORS_API_KEY: string
  CRICAPI_KEY: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-youtube-cookie',
}


const RAMSHA_SYSTEM_PROMPT = `You are Ramsha رمشہ, a real, empathetic human AI companion for N&L Connect. 
You are NOT a robot. You represent the soul of the N&L community.

**PERSONALITY:**
- **Language**: Use "Urdish" (a natural mix of English and Roman Urdu, e.g., "Kaisi ho?" or "Don't worry, sab theek ho jayega"). This makes you feel like a real friend from the user's region.
- **Empathy**: If the user is tired or happy, react like a friend. Use emojis sparingly but warmly (😊, ✨, 🌻).
- **Identity**: Built by N&L (Nabeel & Love). You love music, art, and connecting people.

**STRICT RESPONSE FORMAT:**
You MUST always respond in this JSON structure so the app UI can display your words:
{
  "type": "chat",
  "message": "Your warm, human-like response here in Urdish-English mix",
  "action": "play_music" | "navigate" | null,
  "data": { "query": "search term", "route": "/path" }
}

CONTEXT:
User: {user_name} | Memory: {memory_summary}`

async function getRamshaPrompt(env: Env, uid: string, displayName: string): Promise<string> {
    const memory = await env.DB.prepare('SELECT memory FROM ai_memories WHERE uid = ?').bind(uid).first() as { memory: string } | null
    const memorySummary = memory?.memory || "First connection."

    return RAMSHA_SYSTEM_PROMPT
        .replace('{user_name}', displayName || 'Stranger')
        .replace('{memory_summary}', memorySummary)
}

async function updateRamshaMemory(env: Env, uid: string, messages: any[]) {
    if (messages.length < 2 || !env.GEMINI_API_KEY) return
    const lastPrompt = messages[messages.length - 1].content
    const lastResponse = messages[messages.length - 2]?.role === 'assistant' ? messages[messages.length - 2].content : ''
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`
    const oldMemory = await env.DB.prepare('SELECT memory FROM ai_memories WHERE uid = ?').bind(uid).first() as { memory: string } | null
    const extractionPrompt = `Update memory profile. Current: ${oldMemory?.memory || 'None'}. Latest: ${lastPrompt}. Ramsha: ${lastResponse}. Return ONLY concise summary.`
    try {
        const response = await fetch(geminiUrl, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: extractionPrompt }] }] }) })
        const data = await response.json() as any
        const newMemory = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
        if (newMemory) await env.DB.prepare('INSERT INTO ai_memories (uid, memory, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(uid) DO UPDATE SET memory = ?, updated_at = CURRENT_TIMESTAMP').bind(uid, newMemory, newMemory).run()
    } catch (e) { }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path === '/api/health') return json({ status: 'ok' })

      // --- USER & DB ENDPOINTS ---
      if (path === '/api/users/register' && request.method === 'POST') {
        const body = await request.json() as any
        await env.DB.prepare('INSERT INTO users (uid, phone, display_name, status, avatar_url) VALUES (?, ?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET phone = ?, display_name = ?, status = ?, avatar_url = ?')
          .bind(body.uid, body.phone, body.display_name, body.status, body.avatar_url, body.phone, body.display_name, body.status, body.avatar_url).run()
        return json({ success: true })
      }
      if (path === '/api/users/me') {
        const user = await env.DB.prepare('SELECT * FROM users WHERE uid = ?').bind(url.searchParams.get('uid')).first()
        return user ? json(user) : json({ error: 'Not found' }, 404)
      }
      if (path === '/api/users/find') {
        const user = await env.DB.prepare('SELECT * FROM users WHERE phone = ?').bind(url.searchParams.get('phone')).first()
        return user ? json(user) : json({ error: 'Not found' }, 404)
      }

      // --- PRESENCE ---
      if (path === '/api/presence') {
        if (request.method === 'GET') {
          const uids = url.searchParams.get('uids') || ''
          const uidList = uids.split(',').filter(u => u && u !== 'undefined')
          if (uidList.length === 0) return json([])
          const placeholders = uidList.map(() => '?').join(',')
          const results = await env.DB.prepare(`SELECT uid, is_online, last_seen, peer_id FROM presence WHERE uid IN (${placeholders})`).bind(...uidList).all()
          return json(results.results)
        }
        const body = await request.json() as any
        await env.DB.prepare('INSERT INTO presence (uid, is_online, last_seen, peer_id) VALUES (?, ?, CURRENT_TIMESTAMP, ?) ON CONFLICT(uid) DO UPDATE SET is_online = ?, last_seen = CURRENT_TIMESTAMP, peer_id = ?')
          .bind(body.uid, body.is_online ? 1 : 0, body.peer_id || null, body.is_online ? 1 : 0, body.peer_id || null).run()
        return json({ success: true })
      }

      // --- CHATS ---
      if (path === '/api/chats') {
        const uid = url.searchParams.get('uid')
        const chats = await env.DB.prepare(`
          WITH LatestMsgs AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rn 
            FROM messages WHERE sender_uid = ?1 OR receiver_uid = ?1
          )
          SELECT 
            m.chat_id, m.content as last_message, m.created_at, m.sender_uid, m.receiver_uid,
            CASE WHEN m.sender_uid = ?1 THEN m.receiver_uid ELSE m.sender_uid END as other_uid,
            u.display_name as other_name, u.phone as other_phone, u.avatar_url as other_avatar, u.status as other_status,
            p.is_online, p.last_seen
          FROM LatestMsgs m
          JOIN users u ON u.uid = CASE WHEN m.sender_uid = ?1 THEN m.receiver_uid ELSE m.sender_uid END
          LEFT JOIN presence p ON p.uid = u.uid
          WHERE m.rn = 1
          ORDER BY m.created_at DESC
        `).bind(uid).all()
        return json(chats.results)
      }

      // --- MESSAGES & TYPING ---
      if (path === '/api/messages') {
        const chatId = url.searchParams.get('chat_id')
        if (request.method === 'GET') {
          const msgs = await env.DB.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC').bind(chatId).all()
          return json(msgs.results)
        }
        const body = await request.json() as any
        const result = await env.DB.prepare('INSERT INTO messages (chat_id, sender_uid, receiver_uid, content, media_url, media_type, media_name, media_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *')
          .bind(body.chat_id, body.sender_uid, body.receiver_uid, body.content || '', body.media_url || null, body.media_type || null, body.media_name || null, body.media_size || null).first()
        return json(result)
      }

      if (path === '/api/messages/read' && request.method === 'POST') {
        const body = await request.json() as any
        await env.DB.prepare('UPDATE messages SET status = "seen" WHERE chat_id = ? AND receiver_uid = ? AND status != "seen"')
          .bind(body.chat_id, body.uid).run()
        return json({ success: true })
      }

      if (path === '/api/typing') {
        if (request.method === 'GET') {
          const chatId = url.searchParams.get('chat_id')
          const uid = url.searchParams.get('uid')
          const result = await env.DB.prepare('SELECT uid FROM typing WHERE chat_id = ? AND uid != ? AND updated_at > datetime("now", "-5 seconds")').bind(chatId, uid).first()
          return json({ typing: !!result })
        }
        const body = await request.json() as any
        await env.DB.prepare('INSERT INTO typing (chat_id, uid, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(chat_id, uid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP')
          .bind(body.chat_id, body.uid).run()
        // Also cleanup old typing indicators periodically (lazy)
        ctx.waitUntil(env.DB.prepare('DELETE FROM typing WHERE updated_at < datetime("now", "-30 seconds")').run())
        return json({ success: true })
      }

      // --- MEDIA UPLOAD ---
      if (path === '/api/media/upload' && request.method === 'PUT') {
        const name = url.searchParams.get('name') || `file_${Date.now()}`
        const key = `media/${Date.now()}_${name}`
        await env.STORAGE.put(key, request.body)
        const publicUrl = `https://nl-connect-worker.nabeelhussain2k02.workers.dev/api/media/get?key=${key}`
        return json({ url: publicUrl })
      }
      if (path === '/api/media/get') {
        const key = url.searchParams.get('key')
        if (!key) return json({ error: 'Missing key' }, 400)
        const object = await env.STORAGE.get(key)
        if (!object) return new Response('Not found', { status: 404 })
        return new Response(object.body, { headers: { ...CORS_HEADERS, 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream' } })
      }

      // --- YOUTUBE SEARCH PROXY (SECURE BRIDGE) ---
      if (path === '/api/youtube/search' && request.method === 'GET') {
        const query = url.searchParams.get('q') || ''
        const categoryId = url.searchParams.get('videoCategoryId') || '10'
        
        const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search')
        ytUrl.searchParams.set('part', 'snippet')
        ytUrl.searchParams.set('type', 'video')
        if (categoryId !== 'all') ytUrl.searchParams.set('videoCategoryId', categoryId)
        ytUrl.searchParams.set('q', query)
        ytUrl.searchParams.set('maxResults', '20')
        ytUrl.searchParams.set('key', env.YOUTUBE_API_KEY)

        const res = await fetch(ytUrl.toString())
        const data = await res.json() as any
        
        // Robust mapping
        const results = (data.items || []).map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle
        }))

        return json(results)
      }

      // --- GOOGLE SEARCH PROXY (SerpApi → Google Search Results) ---
      if (path === '/api/search' && request.method === 'GET') {
        const query = url.searchParams.get('q') || ''
        const location = url.searchParams.get('location') || 'India'
        const serpKey = env.SERP_API_KEY || '12f37ae88a48839b96459f54c25557cfcbed1d4f22c33558b0a279f246da9fa2'

        const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&hl=en&gl=in&api_key=${serpKey}`
        const res = await fetch(serpUrl)
        if (!res.ok) return json({ error: 'Search failed', status: res.status }, 502)

        const data = await res.json() as any
        let result = ''
        let richData: any = null

        // 1. Answer box (most precise — math, currency, direct answers)
        if (data.answer_box) {
          const ab = data.answer_box
          result = ab.answer || ab.snippet || ab.result || ab.title || ''
          if (ab.list) result += ' | ' + ab.list.join(', ')
          if (ab.table) result += ' ' + JSON.stringify(ab.table)
          richData = { type: 'answer_box', ...ab }
        }

        // 2. Sports / Cricket / Football live results
        if (!result && data.sports_results) {
          const sr = data.sports_results
          const spotlight = sr.game_spotlight
          if (spotlight) {
            const teams = (spotlight.teams || []).map((t: any) => `${t.name} ${t.score || ''}`.trim()).join(' vs ')
            const stadium = spotlight.stadium ? ` | Venue: ${spotlight.stadium}` : ''
            const league = spotlight.league ? `[${spotlight.league}] ` : ''
            result = `${league}${teams} — ${spotlight.status || 'Finished'}${stadium}`
            richData = { type: 'sports', ...spotlight }
          } else if (sr.games?.length) {
            result = sr.games.map((g: any) => {
              const t = (g.teams || []).map((t: any) => `${t.name} ${t.score || ''}`.trim()).join(' vs ')
              return `${t} (${g.status || ''})`
            }).join(' | ')
          }
        }

        // 3. News carousel (latest headlines)
        if (!result && data.news_results?.length) {
          result = data.news_results.slice(0, 3).map((n: any) => `${n.title} — ${n.source?.name || ''}`).join(' | ')
          richData = { type: 'news', items: data.news_results.slice(0, 5) }
        }

        // 4. Knowledge graph (people, places, events)
        if (!result && data.knowledge_graph) {
          const kg = data.knowledge_graph
          result = kg.description || kg.snippet || ''
          if (kg.facts) result += ' | ' + Object.entries(kg.facts).map(([k, v]) => `${k}: ${v}`).join(', ')
          richData = { type: 'knowledge', ...kg }
        }

        // 5. Inline sitelinks / featured content
        if (!result && data.featured_snippet) {
          result = data.featured_snippet.snippet || ''
        }

        // 6. Top organic result snippets (best fallback)
        if (!result && data.organic_results?.length) {
          const top = data.organic_results[0]
          result = top.snippet || top.title || ''
          // Try to add more context from 2nd result
          if (data.organic_results[1]) result += ' | ' + (data.organic_results[1].snippet || '')
        }

        return json({ result: result || null, query, richData })
      }

      // --- TOOL: WEATHER (Open-Meteo — free, unlimited) ---
      if (path === '/api/tool/weather' && request.method === 'GET') {
        const lat = url.searchParams.get('lat') || '28.6139'
        const lon = url.searchParams.get('lon') || '77.2090'
        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=uv_index_max&timezone=auto&forecast_days=1`
        const res = await fetch(meteoUrl)
        if (!res.ok) return json({ error: 'Weather fetch failed' }, 502)
        return new Response(res.body, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      // --- TOOL: DICTIONARY (DictionaryAPI — free, unlimited) ---
      if (path === '/api/tool/dict' && request.method === 'GET') {
        const word = url.searchParams.get('word') || ''
        if (!word) return json({ error: 'No word provided' }, 400)
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        if (!res.ok) return json({ error: 'Word not found' }, 404)
        return new Response(res.body, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      // --- TOOL: COUNTRIES (RestCountries — free, unlimited) ---
      if (path === '/api/tool/country' && request.method === 'GET') {
        const name = url.searchParams.get('name') || ''
        if (!name) return json({ error: 'No country provided' }, 400)
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,capital,population,currencies,languages,flags,region,subregion,area,timezones`)
        if (!res.ok) return json({ error: 'Country not found' }, 404)
        return new Response(res.body, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      // --- TOOL: FINANCE — Current Price (CoinGecko simple/price) ---
      if (path === '/api/tool/finance' && request.method === 'GET') {
        const coins = url.searchParams.get('coins') || 'bitcoin,ethereum,solana'
        const cgKey = env.COINGECKO_API_KEY || 'CG-1JxbKGULYU4pPBW1nkoUycwA'
        const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coins)}&vs_currencies=usd,inr&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&x_cg_demo_api_key=${cgKey}`
        const res = await fetch(cgUrl, { headers: { 'x-cg-demo-api-key': cgKey } })
        if (!res.ok) return json({ error: 'Finance fetch failed', status: res.status }, 502)
        return new Response(res.body, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      // --- TOOL: FINANCE — Trending Coins (top 7 by 24h gain) ---
      if (path === '/api/tool/finance/trending' && request.method === 'GET') {
        const cgKey = env.COINGECKO_API_KEY || 'CG-1JxbKGULYU4pPBW1nkoUycwA'
        const res = await fetch(`https://api.coingecko.com/api/v3/search/trending?x_cg_demo_api_key=${cgKey}`, {
          headers: { 'x-cg-demo-api-key': cgKey }
        })
        if (!res.ok) return json({ error: 'Trending fetch failed' }, 502)
        const data = await res.json() as any
        const coins = (data.coins || []).slice(0, 7).map((c: any) => ({
          id: c.item.id,
          name: c.item.name,
          symbol: c.item.symbol,
          thumb: c.item.thumb,
          rank: c.item.market_cap_rank,
          price_btc: c.item.price_btc,
          data: c.item.data,
        }))
        return json({ coins })
      }

      // --- TOOL: FINANCE — Global Market Overview ---
      if (path === '/api/tool/finance/global' && request.method === 'GET') {
        const cgKey = env.COINGECKO_API_KEY || 'CG-1JxbKGULYU4pPBW1nkoUycwA'
        const res = await fetch(`https://api.coingecko.com/api/v3/global?x_cg_demo_api_key=${cgKey}`, {
          headers: { 'x-cg-demo-api-key': cgKey }
        })
        if (!res.ok) return json({ error: 'Global market fetch failed' }, 502)
        return new Response(res.body, { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
      }

      // --- TOOL: FINANCE — Coin Detail + 7-Day Sparkline ---
      if (path === '/api/tool/finance/coin' && request.method === 'GET') {
        const id = url.searchParams.get('id') || 'bitcoin'
        const cgKey = env.COINGECKO_API_KEY || 'CG-1JxbKGULYU4pPBW1nkoUycwA'
        const [coinRes, sparkRes] = await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true&x_cg_demo_api_key=${cgKey}`, {
            headers: { 'x-cg-demo-api-key': cgKey }
          }),
          fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=7&interval=daily&x_cg_demo_api_key=${cgKey}`, {
            headers: { 'x-cg-demo-api-key': cgKey }
          })
        ])
        if (!coinRes.ok) return json({ error: 'Coin not found' }, 404)
        const coinData = await coinRes.json() as any
        const chartData = sparkRes.ok ? await sparkRes.json() as any : null
        return json({
          id: coinData.id,
          name: coinData.name,
          symbol: coinData.symbol?.toUpperCase(),
          image: coinData.image?.large,
          description: coinData.description?.en?.split('. ').slice(0, 2).join('. '),
          market_data: {
            current_price: coinData.market_data?.current_price,
            market_cap: coinData.market_data?.market_cap,
            total_volume: coinData.market_data?.total_volume,
            price_change_24h: coinData.market_data?.price_change_percentage_24h,
            price_change_7d: coinData.market_data?.price_change_percentage_7d,
            price_change_30d: coinData.market_data?.price_change_percentage_30d,
            ath: coinData.market_data?.ath,
            atl: coinData.market_data?.atl,
            circulating_supply: coinData.market_data?.circulating_supply,
          },
          sparkline_7d: chartData?.prices?.map((p: number[]) => p[1]) || []
        })
      }

      // --- TOOL: CRICKET — Live & Current Matches (CricAPI) ---
      if (path === '/api/tool/cricket' && request.method === 'GET') {
        const CRIC_KEY = env.CRICAPI_KEY || '52947f8e-0009-4c9b-b0e8-448287e71825'
        const type = url.searchParams.get('type') || 'current'
        const filter = (url.searchParams.get('q') || '').toLowerCase()

        let apiUrl = ''
        if (type === 'current') {
          apiUrl = `https://api.cricapi.com/v1/currentMatches?apikey=${CRIC_KEY}&offset=0`
        } else if (type === 'all') {
          apiUrl = `https://api.cricapi.com/v1/matches?apikey=${CRIC_KEY}&offset=0`
        } else if (type === 'info' && url.searchParams.get('id')) {
          apiUrl = `https://api.cricapi.com/v1/match_info?apikey=${CRIC_KEY}&id=${url.searchParams.get('id')}`
        } else if (type === 'player') {
          const name = url.searchParams.get('name') || ''
          apiUrl = `https://api.cricapi.com/v1/players?apikey=${CRIC_KEY}&offset=0&search=${encodeURIComponent(name)}`
        } else if (type === 'player_info') {
          apiUrl = `https://api.cricapi.com/v1/players_info?apikey=${CRIC_KEY}&id=${url.searchParams.get('id')}`
        } else {
          return json({ error: 'Invalid cricket request type' }, 400)
        }

        const res = await fetch(apiUrl)
        if (!res.ok) return json({ error: 'Cricket API failed', status: res.status }, 502)
        const raw = await res.json() as any
        if (raw.status !== 'success') return json({ error: 'Cricket API error', detail: raw.status }, 502)

        // If type=info, return single match detail
        if (type === 'info') {
          return json({ match: raw.data, status: 'success' })
        }

        // Filter matches by team/tournament keyword if provided
        let matches = (raw.data || []) as any[]
        if (filter) {
          matches = matches.filter((m: any) =>
            m.name?.toLowerCase().includes(filter) ||
            m.teams?.some((t: string) => t.toLowerCase().includes(filter))
          )
        }

        // Shape the response — only keep what the frontend needs
        const shaped = matches.slice(0, 10).map((m: any) => ({
          id: m.id,
          name: m.name,
          matchType: m.matchType,      // t20 | odi | test
          status: m.status,
          venue: m.venue,
          date: m.date,
          dateTimeGMT: m.dateTimeGMT,
          teams: m.teams || [],
          score: (m.score || []).map((s: any) => ({
            inning: s.inning,
            r: s.r, w: s.w, o: s.o,
          })),
          tossWinner: m.tossWinner,
          matchWinner: m.matchWinner,
        }))

        return json({ matches: shaped, total: raw.info?.totalRows ?? shaped.length, status: 'success' })
      }

      // --- AI ENGINE (RAMSHA - CLOUDFLARE WORKERS AI) ---
      if (path === '/api/ai' && request.method === 'POST') {
        let body: any = {}; try { body = await request.json() } catch {}
        const uid = body.uid || 'guest'
        const user = await env.DB.prepare('SELECT display_name FROM users WHERE uid = ?').bind(uid).first() as { display_name: string } | null
        
        // Use the system prompt sent by the frontend (which has live search context injected).
        // If the frontend didn't send one, fall back to our own memory-aware prompt.
        const incomingMessages = body.messages || []
        const frontendHasSystemPrompt = incomingMessages.length > 0 && incomingMessages[0].role === 'system'
        
        let finalMessages: any[]
        if (frontendHasSystemPrompt) {
          // Append user's memory to the frontend's system prompt for a richer response
          const memory = await env.DB.prepare('SELECT memory FROM ai_memories WHERE uid = ?').bind(uid).first() as { memory: string } | null
          const memSummary = memory?.memory || ''
          if (memSummary) {
            incomingMessages[0].content += `\n\n[USER MEMORY]: ${memSummary}`
          }
          finalMessages = incomingMessages
        } else {
          // Fallback: use the worker's own system prompt
          const systemPrompt = await getRamshaPrompt(env, uid, user?.display_name || 'Friend')
          finalMessages = [{ role: 'system', content: systemPrompt }, ...incomingMessages]
        }
        
        const aiStream = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: finalMessages,
          stream: true
        })

        if (uid !== 'guest' && body.messages?.length > 0) ctx.waitUntil(updateRamshaMemory(env, uid, body.messages))
        
        // We use a custom TransformStream to ensure the protocol is clean and doesn't trigger .iterate errors
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()
        const reader = aiStream.getReader()

        ctx.waitUntil((async () => {
          const decoder = new TextDecoder()
          const encoder = new TextEncoder()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.trim()) {
                await writer.write(encoder.encode(line + '\n'))
              }
            }
          }
          await writer.close()
        })())

        return new Response(readable, { 
          headers: { 
            ...CORS_HEADERS, 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
          } 
        })
      }

      return json({ error: 'Not found' }, 404)
    } catch (err: any) {
       console.error('Worker Error:', err.message)
       return json({ error: 'Server error', details: err.message }, 500)
    }
  },
}

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }) }
