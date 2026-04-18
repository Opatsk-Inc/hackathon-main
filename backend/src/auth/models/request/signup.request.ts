import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupRequest {
  @ApiProperty({ description: 'Hromada UUID to register an account for', example: '2d11b394-90de-4fd6-847f-0d36eb53d244' })
  @IsNotEmpty()
  @IsUUID()
  hromadaId: string;

  @ApiProperty({ description: 'Account email address', example: 'hromada@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 characters)', example: 'securePass123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
