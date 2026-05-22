const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/errorMiddleware');

const app = express();

const normalizeOrigin = (o) => (o || '').trim().replace(/\/+$/, '');

const allowedOrigins = env.frontendUrl
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      if (/^https:\/\/manzanasrecorrido(-[a-z0-9-]+)?\.vercel\.app$/.test(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Territorio App' });
});

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
