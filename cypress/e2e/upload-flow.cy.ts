/// <reference types="cypress" />

describe('Flujo para subir imagenes', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
  });

  describe('Login', () => {
    it('debe iniciar sesión', () => {
      cy.fixture('user').then(user => {
        cy.get('#login-email').type(user.email);
        cy.get('#login-password').type(user.password);
        cy.get('.btn-login').click();
      });

      cy.url().should('include', '/dashboard');
      cy.get('.user-highlight').should('be.visible');
    });
  });

  describe('Navegación a upload', () => {
    it('debe navegar a la página de subir imagenes desde el navbar', () => {
      cy.fixture('user').then(user => {
        cy.get('#login-email').type(user.email);
        cy.get('#login-password').type(user.password);
        cy.get('.btn-login').click();
      });

      cy.get('a[routerLink="/upload"]').click();
      cy.url().should('include', '/upload');
      cy.contains('Subir imágenes').should('be.visible');
    });
  });

  describe('Subir imagenes', () => {
    beforeEach(() => {
      cy.fixture('user').then(user => {
        cy.get('#login-email').type(user.email);
        cy.get('#login-password').type(user.password);
        cy.get('.btn-login').click();
      });
      
      cy.get('a[routerLink="/upload"]').click();
      cy.url().should('include', '/upload');
      cy.contains('Subir imágenes').should('be.visible');
    });

    it('debe subir 1 imagen valida JPG', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      cy.get('input[type="file"]').attachFile({
        filePath: 'image1.jpg',
        encoding: 'base64'
      });
      
      cy.contains('Vista previa · 1 imagen', { timeout: 15000 }).should('be.visible');
    });

    it('debe subir 4 imágenes validas', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      cy.get('input[type="file"]').attachFile([
        { filePath: 'image1.jpg', encoding: 'base64' },
        { filePath: 'image2.jpg', encoding: 'base64' },
        { filePath: 'image3.png', encoding: 'base64' },
        { filePath: 'image4.jpg', encoding: 'base64' }
      ]);
      
      cy.contains('Vista previa · 4 imagenes', { timeout: 15000 }).should('be.visible');
    });

    it('debe mostrar error al intentar subir mas de 4 imagenes', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      const files = Array(5).fill(null).map((_, i) => ({
        filePath: 'image1.jpg',
        encoding: 'base64'
      }));
      
      cy.get('input[type="file"]').attachFile(files);
      cy.contains('Solo puedes seleccionar maximo 4 imagenes', { timeout: 5000 }).should('be.visible');
    });

    it('debe mostrar error al subir archivo que no es imagen (PDF)', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      cy.get('input[type="file"]').attachFile({
        filePath: 'document.pdf',
        encoding: 'base64'
      });
      
      cy.contains('Formato no valido: document.pdf. Solo JPG o PNG', { timeout: 5000 }).should('be.visible');
    });

    it('debe mostrar error al subir imagen >5MB', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      cy.get('input[type="file"]').attachFile({
        filePath: 'large.jpg',
        encoding: 'base64'
      });
      
      cy.contains('Imagen excede tamaño: large.jpg. Maximo 5MB.', { timeout: 5000 }).should('be.visible');
    });

    it('debe limpiar todas las imagenes', () => {
      cy.contains('button', 'Seleccionar imágenes').click();
      
      cy.get('input[type="file"]').attachFile([
        { filePath: 'image1.jpg', encoding: 'base64' },
        { filePath: 'image2.jpg', encoding: 'base64' }
      ]);
      
      cy.contains('Vista previa · 2 imagenes', { timeout: 15000 }).should('be.visible');
      
      cy.contains('button', 'Limpiar todas (2)').click();
    });
  });
});