import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

app.use(helmet());

// Limitador general para la API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'Demasiadas peticiones desde esta IP, intenta más tarde.' },
});
app.use('/api/', limiter);

const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.7:5173'];
const productionOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [];
const allowedOrigins = [...localOrigins, ...productionOrigins];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Bloqueado] Origen no permitido: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api', routes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Modexastock API is running' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app; // ✅ Limpiamos el export
