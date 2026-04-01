import * as cheerio from 'cheerio';

export interface AuctionResult {
  title: string;
  price: number;
  date: string;
  url: string;
  source: 'cars-and-bids' | 'bring-a-trailer';
}

/**
 * Search Cars & Bids completed auctions for a given vehicle.
 * Parses the publicly-available search results page.
 */
export async function searchCarsAndBids(
  year: number,
  make: string,
  model: string
): Promise<AuctionResult[]> {
  const query = encodeURIComponent(`${year} ${make} ${model}`);
  const url = `https://carsandbids.com/past-auctions/?q=${query}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const results: AuctionResult[] = [];

    $('.auction-item, .past-auction').each((_, el) => {
      const titleEl = $(el).find('.auction-title a, .title a, h3 a').first();
      const title = titleEl.text().trim();
      const href = titleEl.attr('href');
      const priceText = $(el).find('.auction-result, .sold-price, .bid-value').first().text().trim();
      const dateText = $(el).find('.auction-date, .date, time').first().text().trim();

      const price = parsePrice(priceText);
      if (title && price > 0) {
        results.push({
          title,
          price,
          date: dateText,
          url: href ? (href.startsWith('http') ? href : `https://carsandbids.com${href}`) : url,
          source: 'cars-and-bids',
        });
      }
    });

    return results.slice(0, 10);
  } catch {
    console.error('Cars & Bids scrape failed');
    return [];
  }
}

/**
 * Search Bring a Trailer completed auctions for a given vehicle.
 */
export async function searchBringATrailer(
  year: number,
  make: string,
  model: string
): Promise<AuctionResult[]> {
  const query = encodeURIComponent(`${year} ${make} ${model}`);
  const url = `https://bringatrailer.com/search/?q=${query}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const results: AuctionResult[] = [];

    $('.listing-card, .search-result-item, article.post').each((_, el) => {
      const titleEl = $(el).find('h3 a, .listing-card-title a, .entry-title a').first();
      const title = titleEl.text().trim();
      const href = titleEl.attr('href');
      const priceText = $(el)
        .find('.listing-card-result, .sold-price, .listing-available-price')
        .first()
        .text()
        .trim();
      const dateText = $(el).find('.listing-card-date, time, .date').first().text().trim();

      const price = parsePrice(priceText);
      if (title && price > 0) {
        results.push({
          title,
          price,
          date: dateText,
          url: href || url,
          source: 'bring-a-trailer',
        });
      }
    });

    return results.slice(0, 10);
  } catch {
    console.error('Bring a Trailer scrape failed');
    return [];
  }
}

/**
 * Get aggregated market value from auction sites.
 */
export async function getAuctionMarketValue(
  year: number,
  make: string,
  model: string
): Promise<{
  averagePrice: number | null;
  medianPrice: number | null;
  results: AuctionResult[];
  sources: string[];
}> {
  const [cabResults, batResults] = await Promise.all([
    searchCarsAndBids(year, make, model),
    searchBringATrailer(year, make, model),
  ]);

  const allResults = [...cabResults, ...batResults];
  const prices = allResults.map((r) => r.price).sort((a, b) => a - b);

  if (prices.length === 0) {
    return { averagePrice: null, medianPrice: null, results: [], sources: [] };
  }

  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const mid = Math.floor(prices.length / 2);
  const medianPrice =
    prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid];

  const sources = [...new Set(allResults.map((r) => r.source))];

  return { averagePrice, medianPrice, results: allResults, sources };
}

function parsePrice(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
