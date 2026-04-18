import { Injectable, Logger } from '@nestjs/common';

interface NominatimResult {
  lat: string;
  lon: string;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
        countrycodes: 'ua',
      });

      const response = await fetch(`${this.nominatimUrl}?${params}`, {
        headers: { 'User-Agent': 'LionsShare/1.0 (hackathon@lionsshare.ua)' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const results: NominatimResult[] = await response.json();
      if (!results.length) return null;

      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    } catch (err) {
      this.logger.warn(`Geocoding failed for "${address}": ${(err as Error).message}`);
      return null;
    }
  }
}
