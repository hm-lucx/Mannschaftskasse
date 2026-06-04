import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notifRepo.update({ id, user_id: userId }, { is_read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update({ user_id: userId, is_read: false }, { is_read: true });
  }

  async createForUsers(
    userIds: string[],
    type: string,
    title: string,
    body?: string,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notifRepo.create({ user_id: userId, type, title, body }),
    );
    await this.notifRepo.save(notifications);
  }
}
