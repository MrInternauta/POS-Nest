import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { ApiKeyGuard } from './api-key.guard';

const contextWith = (headers: Record<string, string>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ header: (name: string) => headers[name] }),
    }),
  } as unknown as ExecutionContext);

const guardWithKey = (apiKey: string | undefined) => new ApiKeyGuard({ api_key: apiKey } as never);

describe('ApiKeyGuard', () => {
  it('lets a request with the right key through', () => {
    expect(guardWithKey('secret').canActivate(contextWith({ auth: 'secret' }))).toBe(true);
  });

  it('refuses a request without the key', () => {
    expect(() => guardWithKey('secret').canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('refuses a wrong key, including one that only shares the beginning', () => {
    expect(() => guardWithKey('secret').canActivate(contextWith({ auth: 'nope' }))).toThrow(UnauthorizedException);
    expect(() => guardWithKey('secret').canActivate(contextWith({ auth: 'secret2' }))).toThrow(UnauthorizedException);
  });

  it('refuses everything when no key is configured', () => {
    expect(() => guardWithKey(undefined).canActivate(contextWith({ auth: '' }))).toThrow(UnauthorizedException);
  });
});
