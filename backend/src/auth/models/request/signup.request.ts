import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SignupRequest {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 characters)', example: 'securePass123', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'First name', example: 'John', required: false })
  @IsOptional()
  @Matches(RegExp('^[A-Za-z ]+$'))
  @MaxLength(20)
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  @IsOptional()
  @Matches(RegExp('^[A-Za-z ]+$'))
  @MaxLength(20)
  lastName?: string;

  @ApiProperty({ enum: Role, description: 'User role', example: Role.WAREHOUSE_MANAGER })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ description: 'Warehouse ID to assign (required for WAREHOUSE_MANAGER)', required: false })
  @IsOptional()
  @IsString()
  warehouseId?: string;
}
