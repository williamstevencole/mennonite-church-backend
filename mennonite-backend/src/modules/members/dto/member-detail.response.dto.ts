import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType } from '../doc-type-enum';
import {
  MemberChurchRelationResponseDto,
  MemberUserRelationResponseDto,
  MemberLinkedUserRelationResponseDto,
  BoardMemberRelationResponseDto,
  MinistryMemberRelationResponseDto,
  EventResponsibleMemberRelationResponseDto,
  MemberEventRelationResponseDto,
} from './member-relations.response.dto';

export class MemberDetailResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() idChurch!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: DocumentType }) documentType!: DocumentType;
  @ApiProperty() documentNumber!: string;
  @ApiPropertyOptional() profession!: string | null | undefined;
  @ApiProperty() @Type(() => Date) birthDate!: Date;
  @ApiPropertyOptional() phone!: string | null | undefined;
  @ApiPropertyOptional() personalEmail!: string | null | undefined;
  @ApiPropertyOptional() address!: string | null | undefined;
  @ApiPropertyOptional() @Type(() => Date) baptismDate!:
    | Date
    | null
    | undefined;
  @ApiProperty() @Type(() => Date) joinDate!: Date;
  @ApiProperty() active!: boolean;
  @ApiPropertyOptional() @Type(() => Date) inactivatedAt!:
    | Date
    | null
    | undefined;
  @ApiPropertyOptional({
    nullable: true,
    type: MemberChurchRelationResponseDto,
  })
  church!: MemberChurchRelationResponseDto | null;
  @ApiPropertyOptional({ nullable: true, type: MemberUserRelationResponseDto })
  createdBy!: MemberUserRelationResponseDto | null;
  @ApiPropertyOptional({
    nullable: true,
    type: MemberLinkedUserRelationResponseDto,
  })
  linkedUser!: MemberLinkedUserRelationResponseDto | null;

  @ApiPropertyOptional({ type: [BoardMemberRelationResponseDto] })
  boardMembers!: BoardMemberRelationResponseDto[];
  @ApiPropertyOptional({ type: [MinistryMemberRelationResponseDto] })
  ministryMembers!: MinistryMemberRelationResponseDto[];
  @ApiPropertyOptional({ type: [EventResponsibleMemberRelationResponseDto] })
  eventResponsibilities!: EventResponsibleMemberRelationResponseDto[];
  @ApiPropertyOptional({ type: [MemberEventRelationResponseDto] })
  memberEvents!: MemberEventRelationResponseDto[];
}
