export interface PlayStoreMetadata {
  packageName: string;
  appName: string;
  appIcon: string;
}

interface CacheEntry {
  data: PlayStoreMetadata;
  timestamp: number;
}

// In-memory metadata cache by package name (TTL: 1 hour = 3,600,000 ms)
const CACHE_TTL_MS = 3600000;
const metadataCache = new Map<string, CacheEntry>();

// Rate limiter: Max 20 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || now > entry.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Extracts and validates package name from a Google Play URL or raw package name string.
 * Supports:
 * - https://play.google.com/store/apps/details?id=com.whatsapp
 * - com.whatsapp
 * - in.dream11.app
 * - com.instagram.android
 */
export function extractPackageName(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Reverse domain notation package name validation regex (e.g. com.whatsapp or in.dream11.app)
  const packageRegex = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/;

  // 1. Check if raw package name
  if (packageRegex.test(trimmed)) {
    return trimmed;
  }

  // 2. Try URL search parameter parsing
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const idParam = urlObj.searchParams.get('id');
    if (idParam && packageRegex.test(idParam)) {
      return idParam;
    }
  } catch {
    // Ignore URL parse error
  }

  // 3. Regex search for id= query param in messy/relative URL
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)/);
  if (idMatch && idMatch[1] && packageRegex.test(idMatch[1])) {
    return idMatch[1];
  }

  // 4. Regex search for apps/details/ path
  const pathMatch = trimmed.match(/apps\/details\/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)/);
  if (pathMatch && pathMatch[1] && packageRegex.test(pathMatch[1])) {
    return pathMatch[1];
  }

  return null;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Fetches app metadata directly from Google Play Store server-side.
 * Uses in-memory cache to avoid duplicate external requests.
 */
export async function fetchPlayStoreMetadata(packageName: string): Promise<PlayStoreMetadata> {
  // Check cache first
  const cached = metadataCache.get(packageName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=US`;

  const response = await fetch(playStoreUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Application not found on Google Play.`);
    }
    throw new Error(`Failed to fetch metadata from Google Play Store (HTTP ${response.status}).`);
  }

  const html = await response.text();

  // Extract App Name
  let rawAppName = '';
  const itempropNameMatch = html.match(/itemprop="name">([^<]+)</i);
  if (itempropNameMatch && itempropNameMatch[1]) {
    rawAppName = itempropNameMatch[1].trim();
  } else {
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      rawAppName = ogTitleMatch[1]
        .replace(/\s*-\s*Apps on Google Play.*/i, '')
        .replace(/\s*-\s*Google Play.*/i, '')
        .trim();
    }
  }

  const appName = decodeHtmlEntities(rawAppName);

  if (!appName) {
    throw new Error(`Could not extract App Name for '${packageName}'.`);
  }

  // Extract High-Resolution App Icon
  let appIcon = '';
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (ogImageMatch && ogImageMatch[1]) {
    appIcon = decodeHtmlEntities(ogImageMatch[1].trim());
    // Ensure high resolution (s512)
    if (appIcon.includes('=')) {
      appIcon = appIcon.replace(/=[^=]+$/, '=s512');
    } else {
      appIcon += '=s512';
    }
  }

  if (!appIcon || !appIcon.startsWith('http')) {
    throw new Error(`Could not extract high-resolution App Icon for '${packageName}'.`);
  }

  const result: PlayStoreMetadata = {
    packageName,
    appName,
    appIcon,
  };

  // Cache result
  metadataCache.set(packageName, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}
