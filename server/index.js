import express from 'express';
import settingsRouter from './routes/settings.js';
import projectsRouter from './routes/projects.js';
import invoicesRouter from './routes/invoices.js';
import timeEntriesRouter from './routes/time-entries.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

app.use('/api/settings', settingsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/time-entries', timeEntriesRouter);

app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
