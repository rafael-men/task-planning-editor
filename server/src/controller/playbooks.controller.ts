import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UseGuards as ThrottleUseGuards } from '@nestjs/common';
import { AuthGuard } from '../lib/auth.guard';
import { LlmThrottlerGuard } from '../lib/llm-throttler.guard';
import { CurrentUser } from '../lib/current-user.decorator';
import type { UserCtx } from '../lib/user-ctx';
import { PlaybooksService } from '../services/playbooks.service';

@Controller('api/playbooks')
@UseGuards(AuthGuard)
export class PlaybooksController {
  constructor(private readonly service: PlaybooksService) {}

  @Get()
  listar(@CurrentUser() user: UserCtx) {
    return this.service.listar(user.id);
  }

  @Get(':id')
  obter(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.obter(id, user.id);
  }

  @Post()
  criar(@Body() body: unknown, @CurrentUser() user: UserCtx) {
    return this.service.criar(body, user.id);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserCtx,
  ) {
    return this.service.atualizar(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remover(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    await this.service.remover(id, user.id);
  }

  @Post(':id/prompt/preview')
  @ThrottleUseGuards(LlmThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  previewPrompt(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: UserCtx,
  ) {
    return this.service.previewPrompt(id, body, user.id);
  }
}
