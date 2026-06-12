import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserCtx } from './user-ctx';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserCtx => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserCtx;
  },
);
