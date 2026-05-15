import * as cheerio from 'cheerio';

export interface AuctionResult {
  title: string;
  price: number;
  /** Raw price from the listing, before any mileage adjustment */
  rawPrice: number;
  /** Mileage of the comparable vehicle, if available */
  compMileage?: number;
  /** Price after adjusting for mileage difference vs subject vehicle */
  mileageAdjustedPrice?: number;
  date: string;
  url: string;
  source: 'bring-a-trailer' | 'autotrader' | 'cars-com';
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num < 1000 || num > 10_000_000 ? 0 : num;
}

/**
 * Search Bring a Trailer completed auctions via their model page inline JSON.
 * The page embeds `auctionsCompletedInitialData` with real sold prices.
 */
export async function searchBringATrailer(
  year: number,
  make: string,
  model: string
): Promise<AuctionResult[]> {
  // Build model-page slug: "bmw/m4" etc.
  const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
  // Extract first word of model for the slug (e.g. "M4 CS" -> "m4", "911 Carrera S" -> "911")
  const modelSlug = model
    .toLowerCase()
    .split(/[\s/]/)[0]
    .replace(/[^a-z0-9-]/g, '');
  const url = `https://bringatrailer.com/${makeSlug}/${modelSlug}/`;

  const html = await fetchHtml(url);
  if (!html) return [];

  // Extract the inline JSON blob
  const match = html.match(/var auctionsCompletedInitialData\s*=\s*(\{[\s\S]*?\});\s*\/\*/);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]);
    const items: any[] = data.items ?? [];

    return items
      .filter((item) => {
        const itemYear = item.year ?? 0;
        return typeof item.current_bid === 'number' && item.current_bid > 0 &&
          (itemYear === 0 || Math.abs(itemYear - year) <= 2);
      })
      .slice(0, 10)
      .map((item) => {
        // BaT embeds mileage in multiple possible fields
        const compMileage: number | undefined =
          item.mileage ?? item.odometer ?? item.miles ?? undefined;
        const rawPrice = item.current_bid as number;
        return {
          title: item.title ?? `${item.year ?? year} ${make} ${model}`,
          price: rawPrice,
          rawPrice,
          compMileage: typeof compMileage === 'number' ? compMileage : undefined,
          date: item.sold_text_timestamp
            ? new Date(item.sold_text_timestamp * 1000).toISOString()
            : new Date().toISOString(),
          url: item.url ?? url,
          source: 'bring-a-trailer' as const,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Search AutoTrader current listings using their preloaded state JSON.
 */
export async function searchAutoTrader(
  year: number,
  make: string,
  model: string
): Promise<AuctionResult[]> {
  const makeLower = make.toLowerCase().replace(/\s+/g, '-');
  const modelSlug = model
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const url = `https://www.autotrader.com/cars-for-sale/used-cars/${makeLower}/${modelSlug}/?startYear=${year}&endYear=${year}`;

  const html = await fetchHtml(url);
  if (!html) return [];

  const stateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (stateMatch) {
    try {
      const state = JSON.parse(stateMatch[1]);
      const listings: any[] =
        state?.listings?.listings ?? state?.inventory ?? state?.searchResults?.listings ?? [];
      if (listings.length > 0) {
        return listings
          .slice(0, 10)
          .map((l) => {
            const rawPrice = l.pricingDetail?.salePrice ?? l.derivedPrice ?? l.price ?? l.listPrice ?? 0;
            const compMileage: number | undefined = l.mileage ?? l.specifications?.mileage ?? undefined;
            return {
              title: `${l.year ?? year} ${l.make ?? make} ${l.model ?? model} ${l.trim ?? ''}`.trim(),
              price: rawPrice,
              rawPrice,
              compMileage: typeof compMileage === 'number' ? compMileage : undefined,
              date: new Date().toISOString(),
              url: l.listingDetailPageUrl
                ? `https://www.autotrader.com${l.listingDetailPageUrl}`
                : url,
              source: 'autotrader' as const,
            };
          })
          .filter((r) => r.price > 0);
      }
    } catch {
      // fall through to CSS
    }
  }

  const $ = cheerio.load(html);
  const results: AuctionResult[] = [];
  $('[data-cmp="listingCard"], [class*="listing-card"], [class*="inventory-listing"]').each(
    (_, el) => {
      const title = $(el).find('[class*="title"], h2, h3').first().text().trim();
      const priceText = $(el).find('[class*="price"], [class*="primary-price"]').first().text();
      const price = parsePrice(priceText);
      if (title && price > 0) {
        results.push({ title, price, rawPrice: price, date: new Date().toISOString(), url, source: 'autotrader' });
      }
    }
  );
  return results.slice(0, 10);
}

/**
 * Search Cars.com current listings via JSON-LD structured data.
 */
export async function searchCarsDotCom(
  year: number,
  make: string,
  model: string
): Promise<AuctionResult[]> {
  const makeLower = make.toLowerCase();
  const modelSlug = `${makeLower}-${model
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')}`;
  const url =
    `https://www.cars.com/shopping/results/?dealer_id=&keyword=&list_price_max=&list_price_min=` +
    `&makes[]=${makeLower}&maximum_distance=all&models[]=${modelSlug}` +
    `&page_size=20&sort=best_match_desc&stock_type=used&year_max=${year}&year_min=${year}&zip=`;

  const html = await fetchHtml(url);
  if (!html) return [];

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
        const results: AuctionResult[] = data.itemListElement
          .slice(0, 10)
          .map((item: any) => {
            const rawPrice = item.item?.offers?.price ?? item.offers?.price ?? 0;
            const compMileage: number | undefined =
              item.item?.mileageFromOdometer?.value ??
              item.item?.mileage?.value ??
              undefined;
            return {
              title: item.name ?? item.item?.name ?? '',
              price: rawPrice,
              rawPrice,
              compMileage: typeof compMileage === 'number' ? compMileage : undefined,
              date: new Date().toISOString(),
              url: item.item?.url ?? item.url ?? url,
              source: 'cars-com' as const,
            };
          })
          .filter((r: AuctionResult) => r.price > 0);
        if (results.length > 0) return results;
      }
    } catch {
      continue;
    }
  }

  const $ = cheerio.load(html);
  const results: AuctionResult[] = [];
  $(
    '[class*="listing-row"], [class*="vehicle-card"], .shop-srp-listings__listing-row'
  ).each((_, el) => {
    const title = $(el).find('[class*="title"], h2, h3').first().text().trim();
    const priceText = $(el).find('[class*="price"]').first().text();
    const price = parsePrice(priceText);
    if (title && price > 0) {
      results.push({ title, price, rawPrice: price, date: new Date().toISOString(), url, source: 'cars-com' });
    }
  });
  return results.slice(0, 10);
}

/**
 * Aggregate market value from all sources.
 * If subjectMileage is provided, each comparable's price is adjusted for the
 * mileage difference vs the subject vehicle using ~$0.10/mile.
 * Comps without mileage data are used unadjusted.
 */
export async function getAuctionMarketValue(
  year: number,
  make: string,
  model: string,
  subjectMileage?: number
): Promise<{
  averagePrice: number | null;
  medianPrice: number | null;
  results: AuctionResult[];
  sources: string[];
}> {
  const settled = await Promise.allSettled([
    searchBringATrailer(year, make, model),
    searchAutoTrader(year, make, model),
    searchCarsDotCom(year, make, model),
  ]);

  const allResults: AuctionResult[] = settled.flatMap((s) =>
    s.status === 'fulfilled' ? s.value : []
  );

  // Apply mileage adjustment if subject mileage is known.
  // Rule of thumb: ~$0.10 per mile difference for mainstream cars.
  // For a $60-100k sport car the sensitivity is higher (~$0.12-0.15/mile),
  // but $0.10 is a safe conservative estimate.
  const ADJUSTMENT_PER_MILE = 0.10;
  if (subjectMileage != null && subjectMileage > 0) {
    for (const result of allResults) {
      if (result.compMileage != null && result.compMileage > 0) {
        // If comp has MORE miles than subject, subject is worth more → price goes UP
        const mileDelta = result.compMileage - subjectMileage;
        result.mileageAdjustedPrice = Math.round(result.rawPrice + mileDelta * ADJUSTMENT_PER_MILE);
        result.price = result.mileageAdjustedPrice;
      }
    }
  }

  const prices = allResults.map((r) => r.price).sort((a, b) => a - b);

  if (prices.length === 0) {
    return { averagePrice: null, medianPrice: null, results: [], sources: [] };
  }

  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(prices.length / 2);
  const medianPrice =
    prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : prices[mid];

  const sources = [...new Set(allResults.map((r) => r.source))];

  return { averagePrice, medianPrice, results: allResults, sources };
}

