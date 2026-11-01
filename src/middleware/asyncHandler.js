// Express 4 does not forward errors thrown (or promises rejected) inside async handlers.
// Without this wrapper, a simple 403/404/validation error crashes the whole process.
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
