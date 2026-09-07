import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // La URL de tu Vite en desarrollo
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
});
