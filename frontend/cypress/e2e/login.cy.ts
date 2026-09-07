describe('Flujo de Autenticación', () => {
  it('Debería iniciar sesión correctamente y redirigir al Dashboard', () => {
    // 1. Visitar la página de login
    cy.visit('/login');

    // 2. Verificar que estamos en la página correcta
    cy.contains('Modexastock').should('be.visible');
    cy.contains('Ingresa tus credenciales para continuar').should('be.visible');

    // 3. Llenar el formulario
    cy.get('input[type="email"]').type('admin@modexastock.com');
    cy.get('input[type="password"]').type('password123');

    // 4. Enviar el formulario (Buscamos el botón por su texto)
    cy.contains('button', 'Iniciar Sesión').click();

    // 5. Verificar que fuimos redirigidos al Dashboard (URL raíz)
    cy.url().should('eq', 'http://localhost:5173/');

    // 6. Verificar que el menú del Dashboard está visible
    cy.contains('Dashboard Gerencial').should('be.visible');
  });

  it('Debería mantenerse en el login con credenciales inválidas', () => {
    cy.visit('/login');

    cy.get('input[type="email"]').type('admin@modexastock.com');
    cy.get('input[type="password"]').type('contraseña incorrecta');

    cy.contains('button', 'Iniciar Sesión').click();

    // Verificamos que la URL siga siendo la del login (no redirigió)
    cy.url().should('include', '/login');
  });
});