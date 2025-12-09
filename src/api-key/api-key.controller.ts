import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post('create')
  async createApiKey(@Req() req, @Body() dto: CreateApiKeyDto) {
    const userId = req.user.id;
    return this.apiKeyService.createApiKey(
      userId,
      dto.name,
      dto.permissions,
      dto.expiry,
    );
  }

  @Post('rollover')
  async rolloverApiKey(@Req() req, @Body() dto: RolloverApiKeyDto) {
    const userId = req.user.id;
    return this.apiKeyService.rolloverApiKey(
      userId,
      dto.expired_key_id,
      dto.expiry,
    );
  }
}