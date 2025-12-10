import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth('JWT-auth')
@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create new API key' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({ 
    status: 201, 
    description: 'API key created successfully',
    schema: {
      example: {
        api_key: 'sk_live_abc123...',
        expires_at: '2025-12-11T01:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Maximum 5 active API keys allowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Rollover expired API key' })
  @ApiBody({ type: RolloverApiKeyDto })
  @ApiResponse({ 
    status: 201, 
    description: 'New API key created with same permissions',
    schema: {
      example: {
        api_key: 'sk_live_xyz789...',
        expires_at: '2026-01-11T01:30:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'API key is not expired yet' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async rolloverApiKey(@Req() req, @Body() dto: RolloverApiKeyDto) {
    const userId = req.user.id;
    return this.apiKeyService.rolloverApiKey(
      userId,
      dto.expired_key_id,
      dto.expiry,
    );
  }
}