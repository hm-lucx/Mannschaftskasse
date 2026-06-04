import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Event, EventType } from './entities/event.entity';
import { Participation, ParticipationStatus } from './entities/participation.entity';
import { TeamService } from '../team/team.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateParticipationDto } from './dto/create-participation.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Participation) private participationRepo: Repository<Participation>,
    private teamService: TeamService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(userId: string, from?: string, to?: string, type?: EventType) {
    const where: FindOptionsWhere<Event> = {};
    if (type) where.type = type;

    let events = await this.eventRepo.find({
      where,
      order: { starts_at: 'ASC' },
    });

    if (from || to) {
      events = events.filter((e) => {
        const d = new Date(e.starts_at);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to)) return false;
        return true;
      });
    }

    const participations = await this.participationRepo.find({
      where: { user_id: userId },
    });

    const participationMap = new Map(participations.map((p) => [p.event_id, p]));

    return events.map((event) => ({
      ...event,
      my_participation: participationMap.get(event.id) || null,
    }));
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['participations', 'participations.user'] });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(dto: CreateEventDto, createdById: string): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      starts_at: new Date(dto.starts_at),
      response_deadline: dto.response_deadline ? new Date(dto.response_deadline) : null,
      created_by_id: createdById,
    });
    const saved = await this.eventRepo.save(event);

    const memberIds = await this.teamService.getActiveMemberUserIds();
    const participations = memberIds.map((userId) =>
      this.participationRepo.create({
        event_id: saved.id,
        user_id: userId,
        status: ParticipationStatus.PENDING,
      }),
    );
    await this.participationRepo.save(participations);

    await this.notificationsService.createForUsers(
      memberIds,
      'NEW_EVENT',
      `Neues Event: ${saved.title}`,
      `${saved.type} am ${new Date(saved.starts_at).toLocaleDateString('de-AT')}`,
    );

    return this.findOne(saved.id);
  }

  async update(id: string, dto: Partial<CreateEventDto>): Promise<Event> {
    await this.findOne(id);
    await this.eventRepo.update(id, {
      ...dto,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      response_deadline: dto.response_deadline ? new Date(dto.response_deadline) : undefined,
    });
    return this.findOne(id);
  }

  async cancel(id: string): Promise<void> {
    await this.findOne(id);
    await this.eventRepo.update(id, { is_cancelled: true });
  }

  async respond(
    eventId: string,
    userId: string,
    dto: CreateParticipationDto,
    userRoles: string[],
  ): Promise<Participation> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.is_cancelled) throw new ConflictException('Event is cancelled');

    const now = new Date();
    const isCoachOrAdmin = userRoles.some((r) => ['ADMIN', 'COACH'].includes(r));

    if (event.response_deadline && now > new Date(event.response_deadline) && !isCoachOrAdmin) {
      throw new ConflictException('Response deadline has passed');
    }

    if (dto.status === ParticipationStatus.DECLINED && !dto.decline_reason?.trim()) {
      throw new BadRequestException('A reason is required when declining');
    }

    let participation = await this.participationRepo.findOne({
      where: { event_id: eventId, user_id: userId },
    });

    if (participation) {
      participation.status = dto.status;
      participation.decline_reason = dto.decline_reason || null;
    } else {
      participation = this.participationRepo.create({
        event_id: eventId,
        user_id: userId,
        status: dto.status,
        decline_reason: dto.decline_reason || null,
      });
    }

    return this.participationRepo.save(participation);
  }

  async getResponses(eventId: string) {
    const event = await this.findOne(eventId);
    const participations = event.participations || [];

    const summary = {
      accepted: participations.filter((p) => p.status === ParticipationStatus.ACCEPTED),
      declined: participations.filter((p) => p.status === ParticipationStatus.DECLINED),
      pending: participations.filter((p) => p.status === ParticipationStatus.PENDING),
    };

    return {
      event_id: eventId,
      counts: {
        accepted: summary.accepted.length,
        declined: summary.declined.length,
        pending: summary.pending.length,
        total: participations.length,
      },
      accepted: summary.accepted,
      declined: summary.declined,
      pending: summary.pending,
    };
  }
}
