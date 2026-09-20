/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Mount secure API routes
app.use('/api', apiRouter);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Simple welcome for API server if hits Root directly in dev standalone mode
  app.get('/api-status', (req, res) => {
    res.json({ status: "online", environment: process.env.NODE_ENV || "development" });
  });
}

// Centralized API Error Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error at Express Server Handler:", err);
  res.status(500).json({ error: err.message || "A fatal server error occurred." });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FAANG AI Coach Server listening on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`);
});
