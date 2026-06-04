import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberEventDto } from './create-member-event.dto';

export class UpdateMemberEventDto extends PartialType(CreateMemberEventDto) {}
