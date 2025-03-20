'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const { open } = require('../sqlite-tags')

test('query tag provides cache management methods', (t) => {
  const db = open(':memory:')

  assert.strictEqual(typeof db.query.clearCache, 'function', 'query.clearCache should be a function')
  assert.strictEqual(typeof db.query.cacheSize, 'function', 'query.cacheSize should be a function')
  assert.strictEqual(typeof db.query.cacheCapacity, 'function', 'query.cacheCapacity should be a function')

  db.close()
})

test('query tag uses cache for prepared statements', (t) => {
  const db = open(':memory:')

  // Initialize the database
  db.exec(`
    CREATE TABLE cache_test (id INTEGER PRIMARY KEY, value TEXT);
    INSERT INTO cache_test VALUES (1, 'test1');
    INSERT INTO cache_test VALUES (2, 'test2');
  `)

  // Initial cache size should be 0
  assert.strictEqual(db.query.cacheSize(), 0)

  // Run the same query multiple times
  db.query`SELECT * FROM cache_test WHERE id = ${1}`

  // Cache should now contain 1 prepared statement
  assert.strictEqual(db.query.cacheSize(), 1)

  // Run the same query again
  db.query`SELECT * FROM cache_test WHERE id = ${2}`

  // Cache should still contain 1 prepared statement (same SQL, different param)
  assert.strictEqual(db.query.cacheSize(), 1)

  // Run a different query
  db.query`SELECT COUNT(*) as count FROM cache_test`

  // Cache should now contain 2 prepared statements
  assert.strictEqual(db.query.cacheSize(), 2)

  // Clear the cache
  db.query.clearCache()

  // Cache should be empty
  assert.strictEqual(db.query.cacheSize(), 0)

  db.close()
})

test('query tag respects specified cache size', (t) => {
  const customCacheSize = 5
  const db = open(':memory:', { cacheSize: customCacheSize })

  // Check that the cache capacity matches the custom size
  assert.strictEqual(db.query.cacheCapacity(), customCacheSize)

  db.close()
})

test('query tag cache handles statement errors', (t) => {
  const db = open(':memory:')

  // Cache a valid query first
  db.exec('CREATE TABLE error_test (id INTEGER PRIMARY KEY, value TEXT)')
  db.query`SELECT * FROM error_test`

  assert.strictEqual(db.query.cacheSize(), 1)

  // Now execute an invalid query that should cause an error
  try {
    db.query`SELECT * FROM nonexistent_table`
    assert.fail('Should have thrown an error')
  } catch (err) {
    // This is expected
  }

  // The invalid statement should not be in the cache
  assert.strictEqual(db.query.cacheSize(), 1)

  db.close()
})

test('query tag cache maintains LRU behavior', (t) => {
  // Create a DB with a very small cache
  const tinyCache = 3
  const db = open(':memory:', { cacheSize: tinyCache })

  db.exec(`
    CREATE TABLE lru_test (id INTEGER PRIMARY KEY, value TEXT);
    INSERT INTO lru_test VALUES (1, 'test1');
  `)

  // Fill the cache
  db.query`SELECT * FROM lru_test WHERE id = ${1}`
  db.query`SELECT COUNT(*) FROM lru_test`
  db.query`SELECT value FROM lru_test`

  assert.strictEqual(db.query.cacheSize(), 3)

  // Add one more query that should push out the least recently used one
  db.query`SELECT * FROM lru_test ORDER BY id DESC`

  // Cache size should still be 3 (maximum)
  assert.strictEqual(db.query.cacheSize(), 3)

  // Re-execute the first query to bring it back to the cache
  db.query`SELECT * FROM lru_test WHERE id = ${1}`

  db.close()
})
