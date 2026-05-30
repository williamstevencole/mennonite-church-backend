export const GENERIC_ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autorizado',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  409: 'Conflicto con el estado actual del recurso',
  422: 'Datos no procesables',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
};

export const DEFAULT_GENERIC_MESSAGE = 'Error interno del servidor';

const NEST_DEFAULT_MESSAGES = new Set<string>([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Conflict',
  'Unprocessable Entity',
  'Internal Server Error',
  'Too Many Requests',
]);

export function isNestDefaultMessage(message: string): boolean {
  return NEST_DEFAULT_MESSAGES.has(message);
}

export function genericMessageFor(status: number): string {
  return GENERIC_ERROR_MESSAGES[status] ?? DEFAULT_GENERIC_MESSAGE;
}
