export type Area = 'admin' | 'lider' | 'miembro';

export const SYSTEM_ROLE_AREA: Record<string, Area> = {
  Administrador: 'admin',
  'Líder de Ministerio': 'lider',
  Miembro: 'miembro',
};

export const SYSTEM_PROTECTED_ROLE_NAMES = Object.keys(SYSTEM_ROLE_AREA);

export function isSystemProtectedRole(name: string): boolean {
  return name in SYSTEM_ROLE_AREA;
}

export function systemRoleArea(name: string): Area | null {
  return SYSTEM_ROLE_AREA[name] ?? null;
}
