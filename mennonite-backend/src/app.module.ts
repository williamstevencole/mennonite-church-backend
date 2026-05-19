import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';

type JwtExpiresIn = NonNullable<
  NonNullable<
    Parameters<typeof JwtModule.register>[0]['signOptions']
  >['expiresIn']
>;

const resolveJwtExpiresIn = (value?: string): JwtExpiresIn => {
  if (!value) {
    return '1h';
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return value as JwtExpiresIn;
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn: resolveJwtExpiresIn(process.env.JWT_EXPIRES_IN),
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
