import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';

import { MembersModule } from './modules/members/members.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { UsersModule } from './modules/users/users.module';
import { MinistriesModule } from './modules/ministries/ministries.module';
import { MinistryRoleTypesModule } from './modules/ministry-role-types/ministry-role-types.module';
import { BoardRoleTypesModule } from './modules/board-role-types/board-role-types.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CitiesModule } from './modules/cities/cities.module';
import { TransactionCategoriesModule } from './modules/transaction-categories/transaction-categories.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { EventTypesModule } from './modules/event-types/event-types.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { BudgetDistributionsModule } from './modules/budget-distributions/budget-distributions.module';
import { BudgetCategoriesModule } from './modules/budget-categories/budget-categories.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { BoardMembersModule } from './modules/board-members/board-members.module';
import { MinistryMembersModule } from './modules/ministry-members/ministry-members.module';
import { BoardsModule } from './modules/boards/boards.module';
import { FinancialTransactionsModule } from './modules/financial-transactions/financial-transactions.module';
import { CalendarEventsModule } from './modules/calendar-events/calendar-events.module';
import { PeriodClosuresModule } from './modules/period-closures/period-closures.module';
import { FinancialReportsModule } from './modules/financial-reports/financial-reports.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TripDetailsModule } from './modules/trip-details/trip-details.module';
import { PastorsModule } from './modules/pastors/pastors.module';
import { MemberEventsModule } from './modules/member-events/member-events.module';
import { EventResponsibleMembersModule } from './modules/event-responsible-members/event-responsible-members.module';
import { FundraisingDetailsModule } from './modules/fundraising-details/fundraising-details.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    MembersModule,
    PermissionsModule,
    UserRolesModule,
    UsersModule,
    MinistriesModule,
    MinistryRoleTypesModule,
    BoardRoleTypesModule,
    DepartmentsModule,
    CitiesModule,
    TransactionCategoriesModule,
    ChurchesModule,
    EventTypesModule,
    ArticlesModule,
    InventoryMovementsModule,
    BudgetsModule,
    BudgetDistributionsModule,
    BudgetCategoriesModule,
    BoardMembersModule,
    MinistryMembersModule,
    BoardsModule,
    FinancialTransactionsModule,
    CalendarEventsModule,
    PeriodClosuresModule,
    FinancialReportsModule,
    ReportsModule,
    TripDetailsModule,
    PastorsModule,
    MemberEventsModule,
    EventResponsibleMembersModule,
    FundraisingDetailsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
