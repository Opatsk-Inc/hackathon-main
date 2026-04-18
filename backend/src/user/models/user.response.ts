import type { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'First name', nullable: true, required: false })
  firstName: string | null;

  @ApiProperty({ description: 'Last name', nullable: true, required: false })
  lastName: string | null;

  @ApiProperty({ enum: Role, description: 'User role' })
  role: Role;

  @ApiProperty({ description: 'Assigned warehouse ID', nullable: true })
  warehouseId: string | null;

  @ApiProperty({ description: 'Registration date' })
  registrationDate: Date;

  static fromUserEntity(entity: User): UserResponse {
    const response = new UserResponse();
    response.id = entity.id;
    response.email = entity.email;
    response.firstName = entity.firstName;
    response.lastName = entity.lastName;
    response.role = entity.role;
    response.warehouseId = entity.warehouseId;
    response.registrationDate = entity.registrationDate;
    return response;
  }
}
