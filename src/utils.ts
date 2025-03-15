export const getPaginationLimits = (page: string, limit: string) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  return {
    skip,
    limit: limitNumber,
  };
};
