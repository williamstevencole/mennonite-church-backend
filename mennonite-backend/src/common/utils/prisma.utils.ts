export const isDuplicateEmailError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    meta?: {
      target?: unknown;
    };
  };

  if (candidate.code !== 'P2002') {
    return false;
  }

  const target = candidate.meta?.target;

  if (Array.isArray(target)) {
    return target.includes('email');
  }

  if (typeof target === 'string') {
    return target.includes('email');
  }

  return true;
};
