import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // <-- Importar
import routes from './routes';

const app = express();

// Lista de URLs permitidas (localhost y tu red local)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.1.7:5173', // Añade aquí tu IP local si cambia en el futuro
];

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origen (como Postman) o si el origen está en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true, // ¡Crítico para las cookies!
  })
);

app.use(express.json());
app.use(cookieParser());

// Usamos todas las rutas bajo el prefijo /api
app.use('/api', routes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Modexastock API is running' });
});

// Manejo de rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app;
