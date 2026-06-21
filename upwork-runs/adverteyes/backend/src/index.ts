import 'dotenv/config';
import './db'; // initialize DB + seed
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import inventoryRouter from './routes/inventory';
import clientsRouter from './routes/clients';
import campaignsRouter from './routes/campaigns';
import bookingsRouter from './routes/bookings';
import usersRouter from './routes/users';
import weatherRouter from './routes/weather';
import trafficRouter from './routes/traffic';

const app = express();
const PORT = parseInt(process.env.PORT || '3741', 10);

app.use(cors({
  origin: ['https://michaelwegter.com', 'https://www.michaelwegter.com',
           'http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'adverteyes-api', ts: new Date().toISOString() }));

app.use('/auth',      authRouter);
app.use('/inventory', inventoryRouter);
app.use('/clients',   clientsRouter);
app.use('/campaigns', campaignsRouter);
app.use('/bookings',  bookingsRouter);
app.use('/users',     usersRouter);
app.use('/weather',   weatherRouter);
app.use('/traffic',   trafficRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[adverteyes-api] listening on http://127.0.0.1:${PORT}`);
});
