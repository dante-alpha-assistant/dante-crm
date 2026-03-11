import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import contactsRouter from './routes/contacts.js';
import companiesRouter from './routes/companies.js';
import interactionsRouter from './routes/interactions.js';
import remindersRouter, { contactRemindersHandler } from './routes/reminders.js';
import groupsRouter from './routes/groups.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
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
app.post('/api/contacts/:contactId/reminders', contactRemindersHandler);
app.use('/api/groups', groupsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[dante-crm] API server listening on port ${PORT}`);
});
