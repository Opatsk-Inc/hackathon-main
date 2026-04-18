export interface JwtPayload {
  id: string;
  email?: string;
  type: 'hromada' | 'inspector';
}
