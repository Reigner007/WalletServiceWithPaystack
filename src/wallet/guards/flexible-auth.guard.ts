import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from '../../api-key/api-key.service';

@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    const requiredPermission = this.getRequiredPermission(request);

    if (apiKey) {
      try {
        const user = await this.apiKeyService.validateApiKey(apiKey, requiredPermission);
        request.user = user;
        return true;
      } catch (error) {
        throw new UnauthorizedException(error.message);
      }
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtGuard = new (AuthGuard('jwt'))();
      return jwtGuard.canActivate(context) as Promise<boolean>;
    }

    throw new UnauthorizedException('No authentication provided');
  }

  private getRequiredPermission(request: any): string | undefined {
    const route = request.route.path;
    const method = request.method;

    if (route.includes('/deposit') && method === 'POST') {
      return 'deposit';
    }

    if (route.includes('/transfer') && method === 'POST') {
      return 'transfer';
    }

    if (route.includes('/balance') || route.includes('/transactions')) {
      return 'read';
    }

    return undefined;
  }
}