import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StandingsService } from './standings.service';

@Controller('standings')
@UseGuards(JwtAuthGuard)
export class StandingsController {
  constructor(private standingsService: StandingsService) {}

  @Get('current')
  getCurrent() {
    return this.standingsService.getCurrentStandings();
  }
}
