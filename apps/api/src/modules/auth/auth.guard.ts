import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { parse } from 'cookie';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = parse(request.headers.cookie ?? '')[ACCESS_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }
    const tokenUser = this.authService.verifyToken(token);
    request.user = await this.authService.getCurrentUser(tokenUser.id);
    return true;
  }
}
