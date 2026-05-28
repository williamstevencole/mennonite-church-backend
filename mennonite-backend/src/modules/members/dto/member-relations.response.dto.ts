import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MemberChurchRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}

export class MemberUserRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() email!: string;
}

export class MemberLinkedUserRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() email!: string;
  @ApiProperty() active!: boolean;
  @ApiPropertyOptional({ nullable: true }) idUserRole!: number | null;
}

export class BoardMemberRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() assignmentType!: string;
  @ApiPropertyOptional({ nullable: true }) idBoard!: number | null;
  @ApiProperty() idMemberRoleType!: number;
  @ApiProperty() @Type(() => Date) startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}

export class MinistryMemberRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() assignmentType!: string;
  @ApiPropertyOptional({ nullable: true }) idMinistry!: number | null;
  @ApiProperty() idMemberRoleType!: number;
  @ApiProperty() @Type(() => Date) startDate!: Date;
  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  endDate!: Date | null;
  @ApiProperty() active!: boolean;
}

export class EventResponsibleMemberRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idEvent!: number;
}

export class MemberEventRelationResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idEvent!: number;
  @ApiProperty() attended!: boolean;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiPropertyOptional({ nullable: true })
  @Type(() => Date)
  createdAt!: Date | null;
}
