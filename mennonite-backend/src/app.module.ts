import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';

import { MembersModule } from './modules/members/members.module';
import { MemberRoleTypesModule } from './modules/member-role-types/member-role-types.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { UsersModule } from './modules/users/users.module';
import { MinistriesModule } from './modules/ministries/ministries.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CitiesModule } from './modules/cities/cities.module';
import { TransactionCategoriesModule } from './modules/transaction-categories/transaction-categories.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { EventTypesModule } from './modules/event-types/event-types.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { BudgetDistributionsModule } from './modules/budget-distributions/budget-distributions.module';
import { BoardMembersModule } from './modules/board-members/board-members.module';
import { BoardsModule } from './modules/boards/boards.module';
import { FinancialTransactionsModule } from './modules/financial-transactions/financial-transactions.module';
import { MemberAssignmentsModule } from './modules/member-assignments/member-assignments.module';
import { CalendarEventsModule } from './modules/calendar-events/calendar-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    MembersModule,
    MemberRoleTypesModule,
    PermissionsModule,
    UserRolesModule,
    UsersModule,
    MinistriesModule,
    DepartmentsModule,
    CitiesModule,
    TransactionCategoriesModule,
    ChurchesModule,
    EventTypesModule,
    ArticlesModule,
    InventoryMovementsModule,
    BudgetDistributionsModule,
    BoardMembersModule,
    BoardsModule,
    FinancialTransactionsModule,
    MemberAssignmentsModule,
    CalendarEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
