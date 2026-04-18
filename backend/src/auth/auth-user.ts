import type { Hromada, Inspector } from '@prisma/client';

export type HromadaUser = Hromada & { type: 'hromada' };
export type InspectorUser = Inspector & { type: 'inspector' };
export type AuthUser = HromadaUser | InspectorUser;
