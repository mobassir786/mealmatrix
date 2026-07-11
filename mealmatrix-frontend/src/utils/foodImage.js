// Fetches a real food photo from the free, no-key-required Foodish API
// (https://foodish-api.com) based on a dish or cuisine name. Results are
// cached in-memory so we don't refetch the same category repeatedly, and
// any failure just returns null so the UI can fall back to an emoji card.

const CATEGORY_KEYWORDS = [
  { keywords: ['biryani'], category: 'biryani' },
  { keywords: ['pizza'], category: 'pizza' },
  { keywords: ['burger'], category: 'burger' },
  { keywords: ['samosa'], category: 'samosa' },
  { keywords: ['dosa'], category: 'dosa' },
  { keywords: ['idly', 'idli'], category: 'idly' },
  { keywords: ['butter', 'paneer', 'tikka', 'curry', 'masala', 'mughlai', 'north indian'], category: 'butter-chicken' },
  { keywords: ['dessert', 'sweet', 'cake', 'jamun'], category: 'dessert' },
  { keywords: ['chinese', 'thai', 'noodle', 'manchurian', 'wok', 'pao'], category: 'pasta' },
  { keywords: ['salad', 'healthy', 'bowl', 'continental', 'grilled'], category: 'rice' },
];

function guessCategory(text = '') {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.category;
  }
  return 'biryani'; // safe default — always a valid Foodish category
}

const cache = new Map();

export async function getFoodImage(text) {
  const category = guessCategory(text);

  if (cache.has(category)) return cache.get(category);

  try {
    const res = await fetch(`https://foodish-api.com/api/images/${category}`);
    if (!res.ok) throw new Error('Foodish API error');
    const data = await res.json();
    cache.set(category, data.image);
    return data.image;
  } catch (err) {
    console.warn('Could not load food image, using fallback:', err.message);
    return null;
  }
}
