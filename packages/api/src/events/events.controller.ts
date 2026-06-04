import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateParticipationDto } from './dto/create-participation.dto';
import { EventType } from './entities/event.entity';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: EventType,
  ) {
    return this.eventsService.findAll(userId, from, to, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'COACH')
  create(@Body() dto: CreateEventDto, @CurrentUser('id') userId: string) {
    return this.eventsService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'COACH')
  update(@Param('id') id: string, @Body() dto: Partial<CreateEventDto>) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }

  @Post(':id/responses')
  respond(
    @Param('id') eventId: string,
    @Body() dto: CreateParticipationDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.respond(eventId, user.id, dto, user.roles || []);
  }

  @Get(':id/responses')
  @Roles('ADMIN', 'COACH')
  getResponses(@Param('id') eventId: string) {
    return this.eventsService.getResponses(eventId);
  }
}
