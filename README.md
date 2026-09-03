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
