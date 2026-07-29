import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { Notification } from '../models/notification.entity';
import type { UserCtx } from '../lib/user-ctx';

@Injectable()
export class NotificationService {
  private readonly notificationEvents = new Subject<Notification>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  get events$(): Observable<Notification> {
    return this.notificationEvents.asObservable();
  }

  async list(user: UserCtx) {
    return this.notificationRepo.find({
      where: { ownerId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, title: string, body?: string) {
    const notification = this.notificationRepo.create({
      ownerId: userId,
      title,
      body,
    });
    const saved = await this.notificationRepo.save(notification);
    this.notificationEvents.next(saved);
    return saved;
  }

  async markRead(id: string, user: UserCtx) {
    const notification = await this.notificationRepo.findOne({
      where: { id, ownerId: user.id },
    });
    if (!notification) return null;
    notification.read = true;
    return this.notificationRepo.save(notification);
  }
}
