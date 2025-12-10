// ==================== src/auth/auth.controller.ts ====================
import { Controller, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req, 
    @Res() res: Response,
  ) {
    const user = req.user;
    const token = this.authService.generateJwtToken(user);

    // Always return JSON for API testing
    return res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        wallet_number: user.wallet?.walletNumber,
      },
    });
  }
}