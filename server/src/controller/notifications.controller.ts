import { Controller, Get, Param, Patch, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs';
import { AuthGuard } from '../lib/auth.guard';
import { CurrentUser } from '../lib/current-user.decorator';
import type { UserCtx } from '../lib/user-ctx';
import { NotificationService } from '../services/notification.service';

@Controller('api/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listar(@CurrentUser() user: UserCtx) {
    return this.notificationService.list(user);
  }

  @Sse('sse')
  sse(@CurrentUser() user: UserCtx): Observable<MessageEvent> {
    return this.notificationService.events$.pipe(
      filter((notification) => notification.ownerId === user.id),
      map((notification) => ({ data: { notification } })),
    );
  }

  @Patch(':id/read')
  marcarLido(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.notificationService.markRead(id, user);
  }
}
