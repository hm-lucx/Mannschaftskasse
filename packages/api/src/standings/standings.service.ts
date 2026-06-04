import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface StandingsRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  is_highlighted: boolean;
}

@Injectable()
export class StandingsService {
  private readonly logger = new Logger(StandingsService.name);
  private cache: { data: StandingsRow[]; updatedAt: Date } | null = null;

  constructor(private config: ConfigService) {}

  async getCurrentStandings(): Promise<{ standings: StandingsRow[]; updatedAt: string | null }> {
    const cacheTtl = this.config.get<number>('STANDINGS_CACHE_TTL_SECONDS', 86400);
    const now = new Date();

    if (this.cache && (now.getTime() - this.cache.updatedAt.getTime()) / 1000 < cacheTtl) {
      return { standings: this.cache.data, updatedAt: this.cache.updatedAt.toISOString() };
    }

    await this.fetchAndCache();
    return {
      standings: this.cache?.data || [],
      updatedAt: this.cache?.updatedAt?.toISOString() || null,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async fetchAndCache() {
    try {
      const url = this.config.get('LIGAPORTAL_URL', 'https://www.ligaportal.at/ooe/2-klasse/2-klasse-sued-west/tabelle');
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Mannschaftskasse/1.0)' },
      });

      const $ = cheerio.load(response.data);
      const rows: StandingsRow[] = [];

      $('table.standings tbody tr, table tr').each((i, el) => {
        const cells = $(el).find('td');
        if (cells.length < 8) return;

        const teamName = $(cells[1]).text().trim() || $(cells[2]).text().trim();
        if (!teamName) return;

        const getText = (idx: number) => parseInt($(cells[idx]).text().trim()) || 0;

        rows.push({
          rank: i + 1,
          team: teamName,
          played: getText(2),
          won: getText(3),
          drawn: getText(4),
          lost: getText(5),
          goals_for: 0,
          goals_against: 0,
          goal_diff: getText(6),
          points: getText(7),
          is_highlighted: teamName.toLowerCase().includes('schwand'),
        });
      });

      if (rows.length > 0) {
        this.cache = { data: rows, updatedAt: new Date() };
        this.logger.log(`Standings refreshed: ${rows.length} teams`);
      } else {
        this.logger.warn('Standings scraper returned no rows — keeping cached data');
      }
    } catch (err) {
      this.logger.error('Failed to fetch standings', err.message);
    }
  }
}
