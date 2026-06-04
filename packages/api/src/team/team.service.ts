import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMembership } from './entities/team-membership.entity';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TeamMembership) private membershipRepo: Repository<TeamMembership>,
  ) {}

  async getActiveTeam(): Promise<Team> {
    return this.teamRepo.findOne({ where: { is_active: true } });
  }

  async getActiveMembers(): Promise<TeamMembership[]> {
    return this.membershipRepo.find({
      where: { left_at: null },
      relations: ['user'],
    });
  }

  async getActiveMemberUserIds(): Promise<string[]> {
    const members = await this.getActiveMembers();
    return members.map((m) => m.user_id);
  }
}
