const errorHandler = (err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
  };

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ message: err.message });
  };

  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({ message: `A record with that ${field} already exists.` });
  };

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found.' });
  };

  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ message });
};

module.exports = errorHandler;