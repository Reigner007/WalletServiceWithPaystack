// ==================== src/auth/auth.controller.ts ====================
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth sign-in' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns JWT token and user information',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'John Doe',
          wallet_number: '1733780123456'
        }
      }
    }
  })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateJwtToken(user);

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