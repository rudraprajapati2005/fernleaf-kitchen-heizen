import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './auth.types';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.email, body.password);
    response.cookie(ACCESS_TOKEN_COOKIE, result.token, cookieOptions);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): { success: true } {
    response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() request: Request & { user?: AuthenticatedUser }): Promise<{ user: AuthenticatedUser }> {
    return { user: request.user! };
  }
}
