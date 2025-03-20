'use strict'

const sqlite = require('node:sqlite')
const mnemonist = require('mnemonist')

/**
 * Default cache size for prepared statements
 * @type {number}
 */
const DEFAULT_CACHE_SIZE = 100

/**
 * Creates a tagged template literal function for executing SQL queries
 * with parameter substitution, using an LRU cache for prepared statements.
 *
 * @param {sqlite.DatabaseSync} db - The SQLite database instance
 * @param {Object} [options] - Configuration options
 * @param {number} [options.cacheSize=100] - Maximum number of prepared statements to cache
 * @returns {Function} A template tag function for SQL queries
 */
function createQueryTag (db, options = {}) {
  const cacheSize = options.cacheSize || DEFAULT_CACHE_SIZE

  // Create an LRU cache for prepared statements
  const stmtCache = new mnemonist.LRUCache(cacheSize)

  /**
   * Tagged template function for SQL queries
   *
   * @param {Array<string>} strings - SQL query string parts
   * @param {...any} values - Values to be inserted into the query
   * @returns {Array<object>} Query results
   */
  function query (strings, ...values) {
    // Construct the SQL query
    const sql = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? '?' : '')
    }, '')

    let stmt

    // Try to get the prepared statement from the cache
    if (stmtCache.has(sql)) {
      stmt = stmtCache.get(sql)
    } else {
      // Create a new prepared statement and add it to the cache
      stmt = db.prepare(sql)
      stmtCache.set(sql, stmt)
    }

    try {
      // Bind all parameters if we have any
      if (values.length > 0) {
        return stmt.all(...values)
      }

      return stmt.all()
    } catch (err) {
      // If an error occurs, remove the statement from the cache
      // as it might be invalid for future uses
      stmtCache.delete(sql)
      throw err
    }
  }

  /**
   * Clears the statement cache
   */
  query.clearCache = function clearCache () {
    stmtCache.clear()
  }

  /**
   * Returns the current size of the statement cache
   * @returns {number} Current cache size
   */
  query.cacheSize = function cacheSize () {
    return stmtCache.size
  }

  /**
   * Returns the maximum capacity of the statement cache
   * @returns {number} Maximum cache capacity
   */
  query.cacheCapacity = function cacheCapacity () {
    return stmtCache.capacity
  }

  return query
}

/**
 * Extends a Database instance with a query tagged template function
 *
 * @param {sqlite.DatabaseSync} db - SQLite database instance
 * @param {Object} [options] - Configuration options
 * @param {number} [options.cacheSize=100] - Maximum number of prepared statements to cache
 * @returns {sqlite.DatabaseSync} Enhanced database with query tag method
 */
function addQueryTag (db, options = {}) {
  // Add the query tagged template method to the database instance
  db.query = createQueryTag(db, options)
  return db
}

/**
 * Opens a database and adds the query tagged template function
 *
 * @param {string|URL|Buffer} path - Database filename
 * @param {Object} [options] - Database open options and query tag options
 * @param {number} [options.cacheSize=100] - Maximum number of prepared statements to cache
 * @returns {sqlite.DatabaseSync} Enhanced database with query tag
 */
function open (path, options = {}) {
  // Extract options for the database and for the query tag
  const { cacheSize, ...dbOptions } = options

  const db = new sqlite.DatabaseSync(path, dbOptions)
  return addQueryTag(db, { cacheSize })
}

module.exports = {
  open,
  addQueryTag,
  createQueryTag,
  DEFAULT_CACHE_SIZE
}
