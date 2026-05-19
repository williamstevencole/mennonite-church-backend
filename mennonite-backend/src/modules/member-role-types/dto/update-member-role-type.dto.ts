import { PartialType } from '@nestjs/swagger';
import { CreateMemberRoleTypeDto } from './create-member-role-type.dto';

export class UpdateMemberRoleTypeDto extends PartialType(
  CreateMemberRoleTypeDto,
) {}
