import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { openapiSpec } from './openapi.js';
import healthRouter from './routes/health.js';
import usersRouter from './routes/users.js';
import vendorsRouter from './routes/vendors.js';
import materialsRouter from './routes/materials.js';
import projectsRouter from './routes/projects.js';
import purchaseOrdersRouter from './routes/purchase-orders.js';
import deliveriesRouter from './routes/deliveries.js';
import inventoryRouter from './routes/inventory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// ---------- API ----------
app.use('/api/health', healthRouter);
app.use('/api/users', usersRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/inventory', inventoryRouter);

// ---------- API docs ----------
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'SubBase API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }),
);
app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec));

// ---------- Static (production) ----------
// In dev, Vite serves the frontend on :5173 with /api proxied here.
// In prod (npm run build && npm run start:prod), Express serves the built client.
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ---------- Error handler ----------
// Last middleware: catches anything thrown in route handlers.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    details: err.details || undefined,
  });
});

app.listen(PORT, () => {
  console.log(`✓ API listening on http://localhost:${PORT}`);
  console.log(`  Docs:    http://localhost:${PORT}/api/docs`);
  if (!fs.existsSync(clientDist)) {
    console.log(`  Web:     http://localhost:5173 (Vite dev — start with npm start)`);
  }
});
