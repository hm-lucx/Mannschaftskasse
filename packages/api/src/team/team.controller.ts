import { Controller, Get, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get('members')
  getMembers() {
    return this.teamService.getActiveMembers();
  }
}
