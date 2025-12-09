import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(userId: string, name: string, permissions: string[], expiry: string) {
    // Check if user has 5 active keys
    const activeKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeKeys.length >= 5) {
      throw new BadRequestException('Maximum of 5 active API keys allowed per user');
    }

    // Validate permissions
    const validPermissions = ['deposit', 'transfer', 'read'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Calculate expiration date
    const expiresAt = this.calculateExpiryDate(expiry);

    // Generate API key
    const apiKey = this.generateApiKey();

    const createdKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        key: apiKey,
        permissions,
        expiresAt,
      },
    });

    return {
      api_key: createdKey.key,
      expires_at: createdKey.expiresAt.toISOString(),
    };
  }

  async rolloverApiKey(userId: string, expiredKeyId: string, expiry: string) {
    const expiredKey = await this.prisma.apiKey.findFirst({
      where: {
        id: expiredKeyId,
        userId,
      },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found');
    }

    // Check if key is truly expired
    if (expiredKey.expiresAt > new Date()) {
      throw new BadRequestException('API key is not expired yet');
    }

    // Check active keys limit
    const activeKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeKeys.length >= 5) {
      throw new BadRequestException('Maximum of 5 active API keys allowed per user');
    }

    // Create new key with same permissions
    const expiresAt = this.calculateExpiryDate(expiry);
    const newApiKey = this.generateApiKey();

    const createdKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: expiredKey.name,
        key: newApiKey,
        permissions: expiredKey.permissions,
        expiresAt,
      },
    });

    return {
      api_key: createdKey.key,
      expires_at: createdKey.expiresAt.toISOString(),
    };
  }

  async validateApiKey(apiKey: string, requiredPermission?: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { include: { wallet: true } } },
    });

    if (!key) {
      throw new BadRequestException('Invalid API key');
    }

    if (key.isRevoked) {
      throw new BadRequestException('API key has been revoked');
    }

    if (key.expiresAt < new Date()) {
      throw new BadRequestException('API key has expired');
    }

    if (requiredPermission && !key.permissions.includes(requiredPermission)) {
      throw new BadRequestException(`API key does not have '${requiredPermission}' permission`);
    }

    return key.user;
  }

  private calculateExpiryDate(expiry: string): Date {
    const now = new Date();
    
    switch (expiry) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException('Invalid expiry format. Use 1H, 1D, 1M, or 1Y');
    }
  }

  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomString = randomBytes(32).toString('hex');
    return prefix + randomString;
  }
}