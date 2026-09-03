import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();

// ✅ 1. HELMET: Configura cabeceras HTTP seguras (previene clickjacking, sniffer, etc.)
app.use(helmet());

// ✅ 2. RATE LIMITER: Evita ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 peticiones cada 15 minutos
  message: { status: 'error', message: 'Demasiadas peticiones desde esta IP, intenta más tarde.' },
});
app.use('/api/', limiter); // Aplica a todas las rutas de la API

// (Opcional) Limitador estricto solo para el login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Máximo 10 intentos de login cada 10 minutos por IP
  message: {
    status: 'error',
    message: 'Demasiados intentos de fallidos. Cuenta bloqueada por 10 minutos.',
  },
});
// Lo aplicaremos en la ruta de auth en el siguiente paso

// Configuración de Orígenes (CORS)
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

export default app;
export { loginLimiter };
