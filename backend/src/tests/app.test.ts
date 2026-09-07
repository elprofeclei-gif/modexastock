import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// ✅ 1. MOCKING (Simulación)
// Simulamos el middleware de autenticación para no depender de la DB real ni de tokens verdaderos.
// Esto hace que los tests corran en 0.1 segundos y no alteren tu base de datos.
vi.mock('../middlewares/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    // Simulamos que si no hay token, falla
    if (!req.headers.authorization && !req.cookies.token) {
      return res.status(401).json({ status: 'error', message: 'Token no proporcionado' });
    }
    // Simulamos que si hay un token de prueba, el usuario es un Admin
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (token === 'test-admin-token') {
      req.user = { id: 'mock-user-id', role: 'ADMIN' };
      return next(); // Lo dejamos pasar
    }
    return res.status(401).json({ status: 'error', message: 'Token inválido' });
  },
  roleMiddleware: (roles: string[]) => (req: any, res: any, next: any) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res
      .status(403)
      .json({ status: 'error', message: 'Acceso denegado. No tienes permisos suficientes.' });
  },
}));

describe('🛡️ Modexastock API - Infraestructura y Seguridad', () => {
  // Test 1: El servidor está vivo
  it('GET /api/health -> debería retornar 200 y status success', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('running');
  });

  // Test 2: Rutas protegidas SIN token (Debe bloquear)
  it('GET /api/products sin token -> debería retornar 401', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Token no proporcionado');
  });

  // ✅ NUEVO Test 3: Rutas protegidas CON token de prueba (Debe dejar pasar el middleware)
  it('GET /api/products con token mock -> debería pasar la autenticación', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer test-admin-token');

    // Como mockeamos el auth, no dará 401.
    // Si la DB está desconectada dará 500, pero no será error de Auth.
    // Lo importante es que NO sea 401.
    expect(response.status).not.toBe(401);
  });

  // Test 4: Ruta inexistente (Manejo de errores 404)
  it('GET /api/nonexistent -> debería retornar 404', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
  });
});
