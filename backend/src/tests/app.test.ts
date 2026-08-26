import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Modexastock API', () => {
  // Test 1: El servidor está vivo
  it('GET /api/health -> should return 200 and status success', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Modexastock API is running');
  });

  // Test 2: Rutas protegidas sin token
  it('GET /api/products -> should return 401 if no token is provided', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Token no proporcionado');
  });

  // Test 3: Ruta inexistente
  it('GET /api/nonexistent -> should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
  });
});
