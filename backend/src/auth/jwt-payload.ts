import { Role } from '@prisma/client';

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
  warehouseId: string | null;
}
