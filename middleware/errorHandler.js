// Simple centralized error handler
module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message, error: err?.stack ? String(err.stack).split('\n')[0] : undefined });
};
