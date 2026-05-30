export interface JwtPayload {
  sub: number;
  supabaseUid: string;
  email: string;
  idChurch: number;
  role: string;
  permissions: string[];
}
