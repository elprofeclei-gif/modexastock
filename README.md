🛍️ Modexastock - Sistema POS & ERP para Tiendas de Ropa
Sistema completo de punto de venta, inventario por variantes (talla/color), tesorería y facturación. Construido con arquitectura MVC, TypeScript estricto y diseño SaaS moderno.

🚀 Guía de Instalación y Primer Uso (Paso a Paso)
Paso 1: Configurar Base de Datos
Crea una base de datos PostgreSQL (recomendado: Neon.tech gratuito en la nube).
Obtén tu cadena de conexión (ej: postgresql://user:pass@host/db?sslmode=require).
Paso 2: Configurar Backend
Abre la carpeta backend en tu terminal.
Crea un archivo .env basado en .env.example y completa tus datos:
DATABASE_URL="tu_cadena_de_conexion_postgres"JWT_SECRET="tu_clave_secreta_super_segura"CLOUDINARY_CLOUD_NAME="tu_cloud_name"CLOUDINARY_API_KEY="tu_api_key"CLOUDINARY_API_SECRET="tu_api_secret"CLIENT_URL="http://localhost:5173"
Instala dependencias y ejecuta la base de datos automatizada:
bash

npm install
npx prisma migrate dev --name init
npx prisma db seed
Esto creará el usuario Admin, los catálogos básicos y las cuentas de tesorería en $0.
Paso 3: Configurar Frontend
Abre la carpeta frontend en tu terminal.
Crea un archivo .env:
env

VITE_API_URL=http://localhost:3000/api
Instala y ejecuta:
bash

npm install
npm run dev
Paso 4: Carga Masiva de Inventario (Excel/CSV)
Una vez inside el sistema con el usuario admin@modexastock.com:

Ve al menú de Usuario (Avatar arriba a la derecha) -> Centro de Datos.
Haz clic en Descargar Plantilla.
Abre el archivo CSV en Excel. Verás columnas: nombre, sku, categoria, marca, talla, color, stock, precio.
Regla de Variantes: Si un producto tiene varias tallas/color, repite el producto en varias filas manteniendo el mismo SKU. El sistema los agrupará automáticamente.
Guarda el archivo manteniendo el formato CSV.
Vuelve al Centro de Datos, haz clic en Seleccionar Archivo y súbelo. ¡El sistema creará todo automáticamente!
Paso 5: Inyección de Capital Inicial
Antes de empezar a vender o comprar:

Ve a Tesorería.
Haz clic en + Ingresar/Retirar.
Selecciona "Ingreso", elige tu "Banco Principal", pon el concepto "Capital Inicial" y el monto. ¡Listo para operar!
text


---

### 2. Automatización de "Onboarding" en el Dashboard
Para que el sistema guíe al usuario de forma visual si está vacío, vamos a añadir un widget de configuración en el Dashboard.

Abre `frontend/src/pages/Dashboard.tsx` y actualiza las importaciones y la vista de Admin para incluir el estado de configuración:

```tsx
// Añade estos imports arriba:
import { useProducts } from '../hooks/useProducts';
import { useTreasury } from '../hooks/useTreasury';
import { CheckCircle2, Circle } from 'lucide-react';

// Actualiza la función principal del Dashboard:
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading } = useReports();
  const { products } = useProducts();
  const { accounts } = useTreasury();

  // ... (código del cajero USER sin cambios) ...

  // Vista ADMIN / MANAGER
  // Verificamos si falta configuración inicial
  const hasInventory = products.length > 0;
  const hasFunds = accounts.reduce((acc, a) => acc + a.balance, 0) > 0;
  const needsOnboarding = !hasInventory || !hasFunds;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Resumen financiero y operativo consolidado.</p>
      </div>

      {/* Banner de Configuración Inicial (Onboarding) */}
      {needsOnboarding && !loading && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4">🚀 Configuración Inicial</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg ${hasFunds ? 'opacity-50' : ''}`}>
              {hasFunds ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-slate-300" />}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">1. Inyectar Capital</p>
                <button onClick={() => navigate('/treasury')} className="text-xs text-indigo-600 hover:underline">Ir a Tesorería</button>
              </div>
            </div>
            <div className={`flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg ${hasInventory ? 'opacity-50' : ''}`}>
              {hasInventory ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-slate-300" />}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">2. Cargar Inventario</p>
                <button onClick={() => navigate('/data-center')} className="text-xs text-indigo-600 hover:underline">Subir Excel</button>
              </div>
            </div>
            <div className={`flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg ${!needsOnboarding ? 'opacity-50' : ''}`}>
              <Circle className="text-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">3. Abrir Caja y Vender</p>
                <button onClick={() => navigate('/pos')} className="text-xs text-indigo-600 hover:underline">Ir al POS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Principales (El resto del código que ya tienes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* ... tus tarjetas de KPIs ... */}
      </div>
      {/* ... resto del dashboard ... */}
3. Asegurar el Hook useTreasury en el Dashboard
Si el hook useTreasury no está exportando accounts, asegúrate de que en frontend/src/hooks/useTreasury.ts el return incluya accounts:

typescript

  return { accounts, expenses, categories, transactions, loading, createExpense, createAccount, createCategory, createTransaction };
¿Cómo funciona la automatización ahora?
Si un amigo o tú clonan el repositorio y siguen el README.md, en 5 minutos tendrán el sistema corriendo.
Al entrar por primera vez, el Dashboard detectará que no hay productos y que el banco está en $0. Mostrará un banner azul elegant diciendo: "1. Inyectar Capital, 2. Cargar Inventario".
Al subir el Excel, el banner desaparecerá mágicamente porque el sistema detecta que ya hay datos.
¡Tu proyecto de portafolio ahora es un producto terminado, documentado y listo para presentarse en entrevistas de trabajo como Ingeniero Senior!