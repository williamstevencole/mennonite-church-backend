import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type JwtPayload = Record<string, unknown>;

type AuthenticatedRequest = {
  headers?: {
    authorization?: string;
  };
  authUserId?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('JWT requerido');
    }

    const payload = await this.verifyToken(token);
    const userId = this.resolveUserId(payload);

    if (!userId) {
      throw new UnauthorizedException('JWT invalido');
    }

    request.authUserId = userId;

    return true;
  }

  private extractToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error: unknown) {
      if (this.isTokenExpiredError(error)) {
        throw new UnauthorizedException('JWT vencido');
      }

      throw new UnauthorizedException('JWT invalido');
    }
  }

  private resolveUserId(payload: JwtPayload): number | null {
    const candidateKeys = ['sub', 'userId', 'id'] as const;

    for (const key of candidateKeys) {
      const value = payload[key];

      if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const numericValue = Number(value.trim());

        if (Number.isInteger(numericValue) && numericValue > 0) {
          return numericValue;
        }
      }
    }

    return null;
  }

  private isTokenExpiredError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as { name?: unknown };
    return maybeError.name === 'TokenExpiredError';
  }
}
