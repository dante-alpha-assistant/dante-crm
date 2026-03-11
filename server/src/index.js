import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import contactsRouter from './routes/contacts.js';
import companiesRouter from './routes/companies.js';
import interactionsRouter from './routes/interactions.js';
import remindersRouter from './routes/reminders.js';
import groupsRouter from './routes/groups.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts from Vite build
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dante-crm', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/contacts', contactsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/groups', groupsRouter);

// Serve static files from the built client (in production)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[dante-crm] API server listening on port ${PORT}`);
});
