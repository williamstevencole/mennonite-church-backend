import type { Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authServiceMock as never);
  });

  it('clears auth cookie and returns no content on logout', () => {
    const clearCookieMock = jest.fn();
    const response = {
      clearCookie: clearCookieMock,
    } as unknown as Response;

    const result = controller.logout(response);

    expect(result).toBeUndefined();
    expect(clearCookieMock).toHaveBeenCalledWith('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
  });

  it('keeps logout idempotent when called multiple times', () => {
    const clearCookieMock = jest.fn();
    const response = {
      clearCookie: clearCookieMock,
    } as unknown as Response;

    controller.logout(response);
    controller.logout(response);

    expect(clearCookieMock).toHaveBeenCalledTimes(2);
  });
});
