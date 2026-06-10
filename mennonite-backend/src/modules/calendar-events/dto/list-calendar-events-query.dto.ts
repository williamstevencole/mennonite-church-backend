import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { EventStatus } from './create-calendar-event.dto';

export enum CalendarEventsSort {
  StartAsc = 'startAsc',
  StartDesc = 'startDesc',
}

export enum CalendarEventOrigin {
  General = 'general',
  Ministry = 'ministry',
}

export class ListCalendarEventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idChurch?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMinistry?: number;

  @ApiPropertyOptional({
    enum: CalendarEventOrigin,
    description:
      'Filtra por origen: "general" (sin ministerio asociado) o "ministry" (cualquier ministerio). Si se pasa idMinistry, este filtro se ignora.',
  })
  @IsOptional()
  @IsEnum(CalendarEventOrigin)
  origin?: CalendarEventOrigin;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEventType?: number;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'Inicio del rango (inclusive) por startDatetime',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Fin del rango (inclusive) por startDatetime',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    example: 'retiro',
    description: 'Búsqueda case-insensitive por título del evento (LIKE %q%).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    enum: CalendarEventsSort,
    description:
      'Orden por startDatetime. Default startAsc (calendario). Usar startDesc para pickers que muestran eventos recientes primero.',
    default: CalendarEventsSort.StartAsc,
  })
  @IsOptional()
  @IsEnum(CalendarEventsSort)
  sort?: CalendarEventsSort;
}
