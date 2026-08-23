import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyRouter } from './routes/verify.js';
import { receiptsRouter } from './routes/receipts.js';
import { agentRouter } from './routes/agent.js';
import { webhooksRouter } from './routes/webhooks.js';
import { consoleRouter } from './routes/console.js';
import { keysRouter } from './routes/keys.js';
import { metricsRouter } from './routes/metrics.js';
import { pool } from './db/index.js';
import { runMigration } from './db/migrate.js';
import { openApiSpec } from './openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '512kb' }));

// Health Check (Supports GET, HEAD, POST from all uptime monitors)
app.all('/health', async (_req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: dbCheck.rows.length === 1 ? 'connected' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (err: any) {
    res.status(200).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/v1/verify', verifyRouter);
app.use('/v1/receipts', receiptsRouter);
app.use('/v1/agent', agentRouter);
app.use('/v1/catalog', agentRouter);
app.use('/v1/payments/webhook', webhooksRouter);
app.use('/v1/console', consoleRouter);
app.use('/v1/keys', keysRouter);
app.use('/v1/metrics', metricsRouter);

// OpenAPI JSON Spec
app.get('/v1/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

// Interactive Scalar API Docs with Concord Custom Theme & Configured Client Libraries
app.get('/docs', (_req, res) => {
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <title>Concord API Reference · Agent Order Verification</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 46 46' fill='none'%3E%3Crect width='46' height='46' rx='6' fill='%23000000'/%3E%3Cpath d='M23 0V19.5' stroke='%23ffffff' stroke-width='3' stroke-linecap='square'/%3E%3Cpath d='M14 10.2L23 19.2L32 10.2' stroke='%23ffffff' stroke-width='3' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M46 23H26.5' stroke='%23ffffff' stroke-width='3' stroke-linecap='square'/%3E%3Cpath d='M35.8 14L26.8 23L35.8 32' stroke='%23ffffff' stroke-width='3' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M23 46V26.5' stroke='%23ffffff' stroke-width='3' stroke-linecap='square'/%3E%3Cpath d='M32 35.8L23 26.8L14 35.8' stroke='%23ffffff' stroke-width='3' stroke-linecap='square' stroke-linejoin='miter'/%3E%3Cpath d='M0 23H19.5' stroke='%23ffffff' stroke-width='3' stroke-linecap='square'/%3E%3Cpath d='M10.2 32L19.2 23L10.2 14' stroke='%23ffffff' stroke-width='3' stroke-linecap='square' stroke-linejoin='miter'/%3E%3C/svg%3E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          :root {
            --scalar-font: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --scalar-font-code: 'JetBrains Mono', monospace;
            --scalar-color-1: #ffffff;
            --scalar-color-2: #e4e4e7;
            --scalar-color-3: #a1a1aa;
            --scalar-color-accent: #c81b1c;
            --scalar-background-1: #000000;
            --scalar-background-2: #09090b;
            --scalar-background-3: #18181b;
            --scalar-background-accent: #c81b1c;
            --scalar-border-color: #27272a;
            --scalar-border-radius: 0px;
            --scalar-border-radius-lg: 0px;
            --scalar-button-1: #c81b1c;
            --scalar-button-1-hover: #b01617;
            --scalar-button-1-color: #ffffff;
          }

          body {
            background-color: #000000 !important;
            color: #ffffff !important;
            font-family: var(--scalar-font);
            margin: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          /* Custom Brand Header Bar in Scalar */
          .concord-docs-header {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 24px;
            background: #09090b;
            border-bottom: 1px solid #27272a;
            font-family: 'Space Grotesk', sans-serif;
          }

          .concord-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #fff;
          }

          .concord-logo {
            width: 26px;
            height: 26px;
          }

          .concord-title {
            font-weight: 700;
            font-size: 15px;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .concord-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            padding: 2px 6px;
            background: rgba(200, 27, 28, 0.15);
            border: 1px solid rgba(200, 27, 28, 0.4);
            color: #c81b1c;
            font-weight: 700;
          }

          .concord-nav-links {
            display: flex;
            align-items: center;
            gap: 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
          }

          .concord-nav-links a {
            color: #a1a1aa;
            text-decoration: none;
            transition: color 0.15s ease;
          }

          .concord-nav-links a:hover {
            color: #ffffff;
          }

          .concord-live-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #10b981;
          }

          .concord-live-dot {
            width: 6px;
            height: 6px;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
          }

          /* Scalar Theme Overrides */
          .scalar-card {
            border-radius: 0 !important;
            border-color: #27272a !important;
          }
          button {
            border-radius: 0 !important;
          }
          .scalar-api-reference {
            --scalar-header-height: 0px;
            flex: 1;
          }

          /* Custom Footer Bar */
          .concord-docs-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            background: #09090b;
            border-top: 1px solid #27272a;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 13px;
            color: #a1a1aa;
            flex-wrap: wrap;
            gap: 12px;
          }

          .concord-footer-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .concord-footer-author strong {
            color: #ffffff;
          }

          .concord-footer-links {
            display: flex;
            align-items: center;
            gap: 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
          }

          .concord-footer-links a {
            color: #e4e4e7;
            text-decoration: none;
            padding: 4px 10px;
            background: #000000;
            border: 1px solid #27272a;
            transition: border-color 0.15s ease, color 0.15s ease;
          }

          .concord-footer-links a:hover {
            border-color: #c81b1c;
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="concord-docs-header">
          <a href="http://localhost:3000" class="concord-brand">
            <svg class="concord-logo" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 0V19.5" stroke="#fff" stroke-width="3" stroke-linecap="square" />
              <path d="M14 10.2L23 19.2L32 10.2" stroke="#fff" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" />
              <path d="M46 23H26.5" stroke="#fff" stroke-width="3" stroke-linecap="square" />
              <path d="M35.8 14L26.8 23L35.8 32" stroke="#fff" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" />
              <path d="M23 46V26.5" stroke="#fff" stroke-width="3" stroke-linecap="square" />
              <path d="M32 35.8L23 26.8L14 35.8" stroke="#fff" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" />
              <path d="M0 23H19.5" stroke="#fff" stroke-width="3" stroke-linecap="square" />
              <path d="M10.2 32L19.2 23L10.2 14" stroke="#fff" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" />
            </svg>
            <div class="concord-title">
              CONCORD
              <span class="concord-tag">DOCS v1.0</span>
            </div>
          </a>

          <div class="concord-nav-links">
            <div class="concord-live-badge">
              <span class="concord-live-dot"></span> API Gateway Online
            </div>
            <a href="http://localhost:3000">Overview</a>
            <a href="http://localhost:3000/shop">Demo Store</a>
            <a href="http://localhost:3000/console">Merchant Console</a>
            <a href="http://localhost:3000/verify/demo">Public Verifier</a>
          </div>
        </div>

        <script
          id="api-reference"
          data-url="/v1/openapi.json"
          data-configuration='${JSON.stringify({
            theme: 'kepler',
            darkMode: true,
            hideModels: false,
            showSidebar: true,
            searchHotKey: 'k',
            layout: 'modern',
            ...(process.env.SCALAR_AGENT_KEY ? { agent: { key: process.env.SCALAR_AGENT_KEY } } : {}),
            defaultHttpClient: {
              targetKey: 'shell',
              clientKey: 'curl',
            },
            hiddenClients: {
              python: ['http.client'],
              js: ['xhr', 'jquery'],
              node: ['undici'],
            },
          })}'
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

        <footer class="concord-docs-footer">
          <div class="concord-footer-left">
            <span class="concord-footer-author">Made by <strong>Kritika Benjwal</strong></span>
          </div>
          <div class="concord-footer-links">
            <a href="https://github.com/Kritika11052005/Concord" target="_blank" rel="noopener noreferrer">
              Kritika11052005/Concord
            </a>
            <a href="https://github.com/Kritika11052005" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/kritika-benjwal" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="mailto:ananya.benjwal@gmail.com">
              ananya.benjwal@gmail.com
            </a>
          </div>
        </footer>
      </body>
    </html>
  `);
});

// Root Redirect to docs
app.get('/', (_req, res) => {
  res.redirect('/docs');
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
    },
  });
});

app.listen(PORT, async () => {
  console.log(`✓ Concord API running on http://localhost:${PORT}`);
  console.log(`✓ Interactive docs available at http://localhost:${PORT}/docs`);
  try {
    await runMigration();
  } catch (err: any) {
    console.error('Migration warning (continuing):', err.message);
  }
});
