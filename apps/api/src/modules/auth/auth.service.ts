import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { AuthenticatedUser, AccessTokenPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<{ user: AuthenticatedUser; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authenticatedUser = this.toAuthenticatedUser(user);
    const token = jwt.sign(
      { sub: authenticatedUser.id, email: authenticatedUser.email, role: authenticatedUser.role },
      this.config.getOrThrow<string>('JWT_SECRET'),
      { expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue },
    );

    return { user: authenticatedUser, token };
  }

  verifyToken(token: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(
        token,
        this.config.getOrThrow<string>('JWT_SECRET'),
      ) as AccessTokenPayload;
      return { id: payload.sub, email: payload.email, name: '', role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is no longer active');
    }
    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string;
    role: AuthenticatedUser['role'];
  }): AuthenticatedUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
