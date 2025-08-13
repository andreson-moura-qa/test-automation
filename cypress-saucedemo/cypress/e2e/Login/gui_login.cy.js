// cypress/e2e/saucedemo_suite.cy.js

/**
 * Este arquivo contém suítes de testes E2E para o site saucedemo.com.
 *
 * Boas práticas aplicadas:
 * - Comando customizado para login para evitar repetição (DRY - Don't Repeat Yourself).
 * - Asserções explícitas para garantir que a página carregou antes das interações.
 * - Seletores de dados ([data-test]) para maior robustez.
 */

// --- COMANDO CUSTOMIZADO DE LOGIN ---
// (Isso normalmente ficaria no arquivo cypress/support/commands.js)
Cypress.Commands.add('login', (username, password) => {
  cy.visit('https://www.saucedemo.com/');
  cy.get('[data-test="username"]').type(username);
  cy.get('[data-test="password"]').type(password);
  cy.get('[data-test="login-button"]').click();
});


// Suíte de testes para a funcionalidade de Login
describe('Swag Labs - Testes de Login', () => {
  beforeEach(() => {
    cy.visit('https://www.saucedemo.com/');
  });

  it('Deve realizar o login com sucesso usando um usuário válido', () => {
    // Usando o comando customizado
    cy.login('standard_user', 'secret_sauce');
    cy.url().should('include', '/inventory.html');
    cy.get('.title').should('be.visible').and('have.text', 'Products');
  });

  it('Deve exibir uma mensagem de erro para um usuário bloqueado', () => {
    cy.login('locked_out_user', 'secret_sauce');
    cy.get('[data-test="error"]').should('be.visible')
      .and('contain.text', 'Epic sadface: Sorry, this user has been locked out.');
  });

  it('Deve exibir uma mensagem de erro para senha incorreta', () => {
    cy.login('standard_user', 'wrong_password');
    cy.get('[data-test="error"]').should('be.visible')
      .and('contain.text', 'Epic sadface: Username and password do not match any user in this service');
  });
});


// Suíte de testes para as funcionalidades da página de produtos
describe('Swag Labs - Funcionalidades de Produtos', () => {
  beforeEach(() => {
    // Faz o login uma vez antes de todos os testes nesta suíte
    cy.login('standard_user', 'secret_sauce');
    cy.url().should('include', '/inventory.html');
  });

  it('Deve adicionar um produto ao carrinho com sucesso', () => {
    cy.get('[data-test^="add-to-cart-"]').first().click();
    cy.get('.shopping_cart_badge').should('have.text', '1');
    cy.get('.inventory_item').first().find('button').should('have.text', 'Remove');
  });

  it('Deve validar a funcionalidade do filtro de produtos (de menor para maior preço)', () => {
    // **CORREÇÃO APLICADA AQUI**
    // Garante que a lista de produtos esteja visível antes de interagir com o filtro.
    cy.get('.inventory_list').should('be.visible');

    // Agora, interage com o filtro com segurança
    cy.get('[data-test="product_sort_container"]').select('lohi');

    const prices = [];
    cy.get('.inventory_item_price').each(($el) => {
      prices.push(Number($el.text().replace('$', '')));
    }).then(() => {
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).to.deep.equal(sortedPrices);
    });
  });
});

// Suíte de teste do fluxo de compra completo
describe('Swag Labs - Fluxo de Compra E2E', () => {
  it('Deve completar o fluxo de compra, desde o login até a confirmação', () => {
    // 1. Login
    cy.login('standard_user', 'secret_sauce');

    // 2. Adicionar produto ao carrinho
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_badge').should('have.text', '1');

    // 3. Ir para o carrinho
    cy.get('.shopping_cart_link').click();
    cy.get('.cart_item').should('have.length', 1);

    // 4. Iniciar o checkout
    cy.get('[data-test="checkout"]').click();
    cy.get('[data-test="firstName"]').type('Rosângela');
    cy.get('[data-test="lastName"]').type('Soares');
    cy.get('[data-test="postalCode"]').type('69000-000');
    cy.get('[data-test="continue"]').click();

    // 5. Revisar e finalizar a compra
    cy.get('.summary_total_label').should('be.visible');
    cy.get('[data-test="finish"]').click();

    // 6. Verificar a página de confirmação
    cy.get('.complete-header').should('have.text', 'Thank you for your order!');
    cy.get('[data-test="back-to-products"]').should('be.visible');
  });
});
