/// <reference types="cypress" />

describe('fake served app', () => {
	beforeEach(() => {
		cy.visit('/');
	});

	it('works', () => {
		cy.get('h1').should('have.text', 'This is a fake app');
	});
});
