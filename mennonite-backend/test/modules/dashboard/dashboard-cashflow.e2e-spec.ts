import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';

interface LoginResponse {
  accessToken: string;
}

interface CashflowPoint {
  name: string;
  income: number;
  expense: number;
}

interface CashflowResponse {
  points: CashflowPoint[];
}

describe('GET /dashboard/cashflow (e2e)', () => {
  let app: INestApplication;
  let bearerToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer() as App)
      .post('/auth/login')
      .send({ email: 'admin@mennonite.local', password: 'Admin12345!' });
    const body = login.body as LoginResponse;
    bearerToken = body.accessToken;
  });

  afterAll(async () => app.close());

  it('responde 200 con la forma esperada para months=6', () => {
    return request(app.getHttpServer() as App)
      .get('/dashboard/cashflow?months=6')
      .set('Authorization', `Bearer ${bearerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const data = body as CashflowResponse;
        expect(Array.isArray(data.points)).toBe(true);
        expect(data.points.length).toBe(6);
        for (const p of data.points) {
          expect(typeof p.name).toBe('string');
          expect(typeof p.income).toBe('number');
          expect(typeof p.expense).toBe('number');
        }
      });
  });

  it('default = 6 meses cuando no viene months', () => {
    return request(app.getHttpServer() as App)
      .get('/dashboard/cashflow')
      .set('Authorization', `Bearer ${bearerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const data = body as CashflowResponse;
        expect(data.points.length).toBe(6);
      });
  });

  it('rechaza months=5 con 400', () => {
    return request(app.getHttpServer() as App)
      .get('/dashboard/cashflow?months=5')
      .set('Authorization', `Bearer ${bearerToken}`)
      .expect(400);
  });

  it('401 sin token', () => {
    return request(app.getHttpServer() as App)
      .get('/dashboard/cashflow')
      .expect(401);
  });
});
