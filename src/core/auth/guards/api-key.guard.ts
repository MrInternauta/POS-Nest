import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ConfigType } from '@nestjs/config';

import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

import { config } from '../../../config';

/**
 * Lets a request through only with the API key in the `auth` header.
 * A route marked public skips the login, never this key: the seed route is both, and an
 * early return on the public marker once let anyone seed production.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(config.KEY) private configService: ConfigType<typeof config>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.api_key || '';
    const received = context.switchToHttp().getRequest<Request>().header('auth') || '';

    if (!expected || !sameKey(received, expected)) {
      throw new UnauthorizedException('User Without a API KEY');
    }
    return true;
  }
}

/** Constant-time comparison, so the response time does not hint at how much of the key matched */
function sameKey(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
