🚀 Modexastock POS & ERP
Sistema de Punto de Venta (POS) y Planificación de Recursos Empresariales (ERP) de nivel Enterprise, diseñado para gestión de inventario de variantes (talla/color), control de caja a prueba de fraudes, tesorería y auditoría contable en tiempo real.

ModexastockLicenseStatus

📋 Tabla de Contenidos
Características Principales
Stack Tecnológico
Arquitectura del Proyecto
Instalación y Puesta en Marcha (Local)
Variables de Entorno
Despliegue en Producción
Seguridad y Auditoría
Pruebas (Testing)
✨ Características Principales
Punto de Venta (POS)
Escáner de Código de Barras: Integración con cámara web para lectura de SKUs en tiempo real.
Ventas Mixtas (Split Tender): Permite cobrar una factura con múltiples métodos de pago (Efectivo + Tarjeta + Crédito).
Ventas Suspendidas: Pausa un carrito de compras para atender a otro cliente y recupéralo después sin perder los datos.
Descuentos Manuales: Aplica descuentos por monto fijo o porcentaje al total de la compra.
Atajos de Efectivo: Botones rápidos para calcular el cambio exacto de forma instantánea.
Impresión Térmica: Generación de tickets para impresoras de 80mm vía Web Print.
Envío por WhatsApp: Envío automático del ticket de compra al cliente.
Inventario y Auditoría
Kardex Trazable: Registro histórico de cada entrada y salida de mercancía (Ventas, Compras, Ajustes).
Ajustes de Stock Autorizados: Cualquier modificación manual de inventario requiere contraseña de Administrador y deja rastro en la bitácora.
Importación Masiva: Carga de productos vía Excel/CSV con generación automática de categorías, marcas y variantes.
Alertas de Bajo Stock: Notificaciones en tiempo real en la barra superior para productos agotados.
Tesorería y Finanzas
Arqueo de Caja Exacto: Cálculo automático del efectivo esperado vs. el contado, aplicando descuadres directamente a la cuenta del cajero.
Cuentas por Cobrar y Pagar: Gestión de deudas de clientes y deudas con proveedores.
Estado de Resultados (P&G): Cálculo de Utilidad Neta en tiempo real (Ventas - COGS - Gastos Operativos).
Reportes Contables (CSV): Exportación de Reporte Z, Ranking de Ventas, Cartera de Clientes, Descuadres de Cajeros y Bitácora del Sistema.
Seguridad (RBAC)
Roles estrictos: ADMIN, MANAGER, USER.
Rutas protegidas en el backend mediante roleMiddleware.
Autenticación mediante JWT (Bearer Token).
Cabeceras de seguridad con helmet y limitación de intentos de login con express-rate-limit.
🛠 Stack Tecnológico
Frontend:

React 18 + TypeScript
Vite (Bundler)
TailwindCSS (Estilos)
Zustand / React Hook Form + Zod (Estado y Validación)
Recharts (Gráficas)
Vite PWA (App Móvil Instalable)
Backend:

Node.js + Express
TypeScript
Prisma ORM (Base de datos)
PostgreSQL (Database)
Vitest + Supertest (Testing)
DevOps & Calidad:

GitHub Actions (CI/CD)
Husky (Pre-commit hooks)
Render (Hosting Backend)
Vercel (Hosting Frontend)
📂 Arquitectura del Proyecto
modexastock/├── .github/│   └── workflows/│       └── build-check.yml      # GitHub Actions (CI/CD)├── .husky/                      # Git Hooks (Pre-commit checks)├── backend/                     # API REST (Node + Express + Prisma)│   ├── prisma/│   │   ├── schema.prisma        # Esquema de la base de datos│   │   └── seed.ts              # Datos iniciales (Admin, Cajas, Config)│   ├── src/│   │   ├── controllers/         # Lógica de negocio│   │   ├── middlewares/         # Auth y Roles│   │   ├── routes/              # Endpoints de la API│   │   ├── tests/               # Pruebas unitarias (Vitest)│   │   └── utils/               # Bitácora, auditoría├── frontend/                    # SPA (React + Vite + Tailwind)│   ├── public/                  # Íconos PWA│   └── src/│       ├── components/          # UI reutilizable (Modales, Tablas)│       ├── hooks/               # Lógica de estado (usePOS, useAuth)│       ├── pages/               # Pantallas (Dashboard, POS, Inventario)│       └── utils/               # Formato, impresión, sonidos└── README.md
🚀 Instalación y Puesta en Marcha (Local)
Sigue estos pasos para correr el proyecto en tu computador para desarrollo.

1. Clonar el repositorio
bash

git clone https://github.com/tu_usuario/modexastock.git
cd modexastock
2. Configurar Backend
bash

cd backend
npm install

# Configurar variables de entorno (Ver sección Variables de Entorno)
# Asegúrate de tener PostgreSQL corriendo localmente o una URL de Neon

# Generar cliente de Prisma y correr migraciones
npx prisma generate
npx prisma migrate dev --name init

# Sembrar datos iniciales (Admin, Cajas, Configuración)
npx prisma db seed

# Iniciar servidor
npm run dev
El backend correrá en http://localhost:3000/api

3. Configurar Frontend
Abre una nueva terminal en la raíz del proyecto:

bash

cd frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
El frontend correrá en http://localhost:5173

🔐 Variables de Entorno
Crea un archivo .env en la carpeta backend con las siguientes variables:

env

# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/modexastock?schema=public"

# Seguridad
JWT_SECRET="tu_codigo_super_secreto_largo_y_seguro"

# Entorno
NODE_ENV="development"
PORT=3000

# Frontend URLs (Para CORS)
CLIENT_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,http://192.168.1.7:5173"

# Cloudinary (Subida de imágenes)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
Crea un archivo .env en la carpeta frontend con la siguiente variable:

env

# URL de la API (Local)
VITE_API_URL="http://localhost:3000/api"
# O para red local dinámica:
# VITE_API_URL=""
🌐 Despliegue en Producción
Este sistema está preparado para desplegarse de forma automatizada en la nube.

Base de Datos: Neon (PostgreSQL Serverless)
Backend: Render.com (Web Service). Compila con npm run build y levanta con npm start.
Frontend: Vercel.com (Vite App). Compila con npm run build.
Flujo de CI/CD:

Se sube código a una rama secundaria (feat/nueva-funcion).
Se abre un Pull Request hacia main.
GitHub Actions compila Frontend y Backend, y corre los tests.
Husky verifica que no haya errores de TypeScript localmente.
Si todo da ✅ verde, se hace el "Merge".
Vercel y Render detectan el cambio y actualizan la versión en producción automáticamente (Auto-Deploy).
🛡 Seguridad y Auditoría
El sistema implementa múltiples capas de control interno:

Bitácora del Sistema: Registra cada anulación, cierre forzoso de caja, ajuste de inventario y cambio de configuración con marca de tiempo y usuario responsable.
Kardex de Inventario: Historial inmutable de cada unidad que entra o sale de la bodega.
Cierre Forzoso: Si un cajero olvida cerrar su caja, un Administrador puede forzar el cierre, aplicando el descuadre directamente a la cuenta del cajero responsable.
Protección CSRF y XSS: Almacenamiento de sesión mediante Bearer Token en el Header, evitando exposición sensible en cookies.
Rate Limiting: Bloqueo temporal de IP tras 10 intentos fallidos de inicio de sesión.
🧪 Pruebas (Testing)
El backend incluye pruebas unitarias de seguridad e infraestructura usando Vitest.

Para correr las pruebas localmente:

bash

cd backend
npm run test
Los tests cubren:

Conectividad del servidor (/api/health).
Seguridad de rutas protegidas (Retorno de error 401 sin token).
Respuesta a rutas inexistentes (Manejo de errores 404).
📄 Licencia
Distribuido bajo la Licencia MIT.
Desarrollado por Cleiber (El Profeclei) & IA.