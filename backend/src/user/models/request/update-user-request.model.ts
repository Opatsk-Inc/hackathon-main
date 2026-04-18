import {
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRequest {
  @ApiProperty({ description: 'First name', required: false })
  @IsOptional()
  @IsNotEmpty()
  @Matches(RegExp('^[A-Za-z ]+$'))
  @MaxLength(20)
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsNotEmpty()
  @Matches(RegExp('^[A-Za-zА-Яа-яІіЇїЄєҐґıöüçğşİÖÜÇĞŞñÑáéíóúÁÉÍÓÚ ]+$'))
  @MaxLength(40)
  lastName?: string;
}
