import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: any) {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.prisma.user.findUnique({
      where: { googleId: id },
    });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            googleId: id,
            email,
            name: displayName,
          },
        });

        const walletNumber = this.generateWalletNumber();

        await tx.wallet.create({
          data: {
            userId: newUser.id,
            walletNumber,
            balance: 0,
          },
        });

        return newUser;
      });
    }

    return user;
  }

  generateJwtToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      googleId: user.googleId,
    };

    return this.jwtService.sign(payload);
  }

  private generateWalletNumber(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return timestamp + random;
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
  }
}