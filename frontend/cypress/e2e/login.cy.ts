describe('Flujo de Autenticación', () => {
  it('Debería iniciar sesión correctamente y redirigir al Dashboard', () => {
    // 1. Visitar la página de login
    cy.visit('/login');

    // 2. Verificar que estamos en la página correcta
    cy.contains('ModexaStock v1.0').should('be.visible');
    cy.contains('Ingresa tus credenciales para continuar').should('be.visible');

    // 3. Llenar el formulario
    cy.get('input[type="email"]').type('admin@modexastock.com');
    cy.get('input[type="password"]').type('password123');

    // 4. Enviar el formulario
    cy.contains('button', 'Iniciar Sesión').click();

    // 5. Verificar que fuimos redirigidos al Dashboard
    cy.url().should('eq', 'http://127.0.0.1:4173/');

    // 6. Verificar que el Dashboard está visible
    cy.contains('Dashboard Gerencial').should('be.visible');
  });

  it('Debería mantenerse en el login con credenciales inválidas', () => {
    cy.visit('/login');

    cy.get('input[type="email"]').type('admin@modexastock.com');
    cy.get('input[type="password"]').type('contraseña incorrecta');

    cy.contains('button', 'Iniciar Sesión').click();

    // Verificar que la URL siga siendo la del login
    cy.url().should('include', '/login');
  });
});