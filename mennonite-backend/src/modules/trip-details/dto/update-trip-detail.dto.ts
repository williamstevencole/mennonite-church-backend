import { PartialType } from '@nestjs/mapped-types';
import { CreateTripDetailDto } from './create-trip-detail.dto';

export class UpdateTripDetailDto extends PartialType(CreateTripDetailDto) {}
