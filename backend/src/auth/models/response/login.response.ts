import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  constructor(token: string) {
    this.token = token;
  }
}
