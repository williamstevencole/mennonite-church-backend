/**
 * Shape of `request.user` after the SupabaseAuthGuard runs.
 * Kept identical to the old JWT-based payload so that
 * PermissionsGuard, @CurrentUser() and all controllers
 * keep working without changes.
 */
export interface JwtPayload {
  /** Local user ID (integer PK from `user` table) */
  sub: number;
  /** Supabase Auth UID (UUID) */
  supabaseUid: string;
  email: string;
  idChurch: number;
  role: string;
  permissions: string[];
}
