import { Injectable, Logger } from '@nestjs/common';

interface NominatimResult {
  lat: string;
  lon: string;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  async geocodeAddress(address: string, retries = 3): Promise<{ lat: number; lng: number } | null> {
    const params = new URLSearchParams({ q: address, format: 'json', limit: '1', countrycodes: 'ua' });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.nominatimUrl}?${params}`, {
          headers: { 'User-Agent': 'LionsShare/1.0 (hackathon@lionsshare.ua)' },
          signal: AbortSignal.timeout(8000),
        });

        if (response.status === 429) {
          const wait = attempt * 2000;
          this.logger.warn(`Nominatim rate-limited, retrying in ${wait}ms (attempt ${attempt}/${retries})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }

        if (!response.ok) return null;

        const results: NominatimResult[] = await response.json();
        if (!results.length) return null;

        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      } catch (err) {
        this.logger.warn(`Geocoding failed for "${address}" (attempt ${attempt}): ${(err as Error).message}`);
        if (attempt === retries) return null;
      }
    }

    return null;
  }
}
