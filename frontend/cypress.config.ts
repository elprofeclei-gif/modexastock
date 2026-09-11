// @ts-nocheck
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // ✅ Lee la variable de entorno, si no existe, usa el puerto 5173 (local)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
});
