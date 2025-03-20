'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const sqlite = require('node:sqlite')
const { open, addQueryTag } = require('../sqlite-tags')

test('open creates a db with query tag', (t) => {
  const db = open(':memory:')
  assert.strictEqual(typeof db.query, 'function')
  db.close()
})

test('addQueryTag adds query method to existing db', (t) => {
  const db = new sqlite.DatabaseSync(':memory:')
  const enhancedDb = addQueryTag(db)
  
  assert.strictEqual(typeof enhancedDb.query, 'function')
  assert.strictEqual(db, enhancedDb) // Should be the same object
  
  db.close()
})

test('query tag performs basic queries', (t) => {
  const db = open(':memory:')
  
  db.exec(`
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
    INSERT INTO products VALUES (1, 'Product A', 10.99);
    INSERT INTO products VALUES (2, 'Product B', 24.99);
    INSERT INTO products VALUES (3, 'Product C', 5.99);
  `)
  
  const id = 2
  const products = db.query`SELECT * FROM products WHERE id = ${id}`
  
  assert.strictEqual(products.length, 1)
  assert.strictEqual(products[0].id, 2)
  assert.strictEqual(products[0].name, 'Product B')
  assert.strictEqual(products[0].price, 24.99)
  
  db.close()
})

test('query tag with multiple parameters', (t) => {
  const db = open(':memory:')
  
  db.exec(`
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, category TEXT);
    INSERT INTO products VALUES (1, 'Product A', 10.99, 'Electronics');
    INSERT INTO products VALUES (2, 'Product B', 24.99, 'Home');
    INSERT INTO products VALUES (3, 'Product C', 5.99, 'Electronics');
    INSERT INTO products VALUES (4, 'Product D', 18.50, 'Clothing');
  `)
  
  const category = 'Electronics'
  const minPrice = 7.00
  
  const products = db.query`SELECT * FROM products WHERE category = ${category} AND price > ${minPrice}`
  
  assert.strictEqual(products.length, 1)
  assert.strictEqual(products[0].id, 1)
  assert.strictEqual(products[0].name, 'Product A')
  
  db.close()
})

test('query tag with no parameters', (t) => {
  const db = open(':memory:')
  
  db.exec(`
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);
    INSERT INTO products VALUES (1, 'Product A');
    INSERT INTO products VALUES (2, 'Product B');
  `)
  
  const products = db.query`SELECT * FROM products ORDER BY id`
  
  assert.strictEqual(products.length, 2)
  assert.strictEqual(products[0].id, 1)
  assert.strictEqual(products[1].id, 2)
  
  db.close()
})

test('query tag with empty result', (t) => {
  const db = open(':memory:')
  
  db.exec(`
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);
    INSERT INTO products VALUES (1, 'Product A');
  `)
  
  const nonExistentId = 999
  const products = db.query`SELECT * FROM products WHERE id = ${nonExistentId}`
  
  assert.strictEqual(products.length, 0)
  
  db.close()
})
