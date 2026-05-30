export type PaginationArgs = { skip: number; take: number };

export function buildPagination(page = 1, limit = 20): PaginationArgs {
  return { skip: (page - 1) * limit, take: limit };
}

export type PaginatedShape<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function toPaginated<T>(
  data: T[],
  total: number,
  page = 1,
  limit = 20,
): PaginatedShape<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
