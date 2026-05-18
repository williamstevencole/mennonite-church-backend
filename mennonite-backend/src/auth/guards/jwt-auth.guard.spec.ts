import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

type RequestLike = {
  headers?: {
    authorization?: string;
  };
  authUserId?: number;
};

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn<Promise<Record<string, unknown>>, [string]>(),
  };

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('accepts a valid JWT and attaches authUserId to request', async () => {
    const request: RequestLike = {
      headers: {
        authorization: 'Bearer valid.jwt.token',
      },
    };
    jwtService.verifyAsync.mockResolvedValue({ sub: '21' });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.authUserId).toBe(21);
  });

  it('throws 401 when JWT is expired', async () => {
    const request: RequestLike = {
      headers: {
        authorization: 'Bearer expired.jwt.token',
      },
    };
    jwtService.verifyAsync.mockRejectedValue({ name: 'TokenExpiredError' });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'JWT vencido',
    );
  });

  it('throws 401 when JWT is invalid', async () => {
    const request: RequestLike = {
      headers: {
        authorization: 'Bearer invalid.jwt.token',
      },
    };
    jwtService.verifyAsync.mockResolvedValue({ email: 'sin-id@iglesia.org' });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      'JWT invalido',
    );
  });
});

function createContext(request: RequestLike): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
