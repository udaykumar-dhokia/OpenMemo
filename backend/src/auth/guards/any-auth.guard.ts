import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ApiKeyGuard } from './api-key.guard.js';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private jwtGuard: JwtAuthGuard,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) return true;
    } catch (e) {
      try {
        const jwtResult = this.jwtGuard.canActivate(context);
        if (jwtResult instanceof Promise) {
          return await jwtResult;
        }
        return !!jwtResult;
      } catch (e2) {
        return false;
      }
    }
    return false;
  }
}
