export interface Sticker {
  id: string
  url: string
  category: string
}

// WhatsApp-style sticker collection (Simulating 1,000+ entries)
// Realistically, we'll provide high-quality categories and a few hundred distinct URLs
export const STICKER_CATEGORIES = ['Trending', 'Funny', 'Love', 'Cool', 'Islamic', 'Animal']

export const STICKER_LIST: Sticker[] = [
  // Trending
  ...['1','2','3','4','5','6','7','8'].map(i => ({ id: `tr-${i}`, url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${10 + parseInt(i)}.png`, category: 'Trending' })),
  // Funny
  ...['1','2','3','4','5','6','7','8'].map(i => ({ id: `fun-${i}`, url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${25 + parseInt(i)}.png`, category: 'Funny' })),
  // Love
  ...['1','2','3','4','5','6','7','8'].map(i => ({ id: `love-${i}`, url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${35 + parseInt(i)}.png`, category: 'Love' })),
  // Cool
  ...['1','2','3','4','5','6','7','8'].map(i => ({ id: `cool-${i}`, url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${150 + parseInt(i)}.png`, category: 'Cool' })),
  // Islamic (Using placeholders for real ones)
  ...['1','2','3','4','5','6','7','8'].map(i => ({ id: `isl-${i}`, url: `https://ui-avatars.com/api/?name=Sticker+${i}&background=075E54&color=fff&size=128`, category: 'Islamic' })),
]

// Expand to simulate 1k entries for the engine search
for (let i = 0; i < 950; i++) {
  STICKER_LIST.push({
    id: `ext-${i}`,
    url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(i % 800) + 1}.png`,
    category: STICKER_CATEGORIES[i % STICKER_CATEGORIES.length]
  })
}
