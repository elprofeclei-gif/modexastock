import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';

const app = express();

// ✅ Leemos CLIENT_URL y separamos por comas. Si no existe, usamos un array vacío.
const clientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : [];

// Lista final de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.2.50:5173',
  'http://127.0.0.1:5173',
  ...clientUrls, // ✅ Agregamos las URLs de tu variable
].filter(Boolean); // Limpiamos espacios vacíos

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origen (como Postman) o si el origen está en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Bloqueado] Origen no permitido: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true, // ¡Crítico para las cookies!
  })
);

app.use(express.json({ limit: '10mb' })); // Límite para Excel pesados
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
