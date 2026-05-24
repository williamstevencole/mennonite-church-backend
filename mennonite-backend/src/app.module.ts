import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

import { MemberRoleTypesModule } from './modules/member-role-types/member-role-types.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { UsersModule } from './modules/users/users.module';
import { MinistriesModule } from './modules/ministries/ministries.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CitiesModule } from './modules/cities/cities.module';
import { TransactionCategoriesModule } from './modules/transaction-categories/transaction-categories.module';

const resolveJwtExpiresIn = (value?: string): number | StringValue => {
  if (!value) {
    return '1h';
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return value as StringValue;
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
    MemberRoleTypesModule,
    PermissionsModule,
    UserRolesModule,
    UsersModule,
    MinistriesModule,
    DepartmentsModule,
    CitiesModule,
    TransactionCategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
