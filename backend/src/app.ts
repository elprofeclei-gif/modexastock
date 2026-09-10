import Sentry from '@sentry/node';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

app.set('trust proxy', 1);

// ✅ INICIALIZACIÓN DE SENTRY
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Lo agregaremos al .env en el siguiente paso
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0, // Captura el 100% de las transacciones (para monitoreo de rendimiento)
});

app.use(helmet());

// Limitador general para la API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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

// ✅ CONFIGURACIÓN DE SWAGGER (Documentación de API)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Modexastock API',
      version: '1.0.0',
      description: 'Documentación oficial del ERP y POS Modexastock',
    },
    // ✅ AGREGAR ESTO PARA EL BOTÓN "AUTHORIZE"
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Modexastock API v2.0 API is running' });
});
// ✅ MIDDLEWARE DE ERRORES DE SENTRY (Debe ir antes de tus manejadores de errores)
Sentry.setupExpressErrorHandler(app);

// Manejo de rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app; // ✅ Limpiamos el export
