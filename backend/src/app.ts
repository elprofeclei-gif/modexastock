import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // <-- Importar
import routes from './routes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
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
