'use strict'

const sqlite = require('node:sqlite')

/**
 * Creates a tagged template literal function for executing SQL queries
 * with parameter substitution.
 *
 * @param {sqlite.DatabaseSync} db - The SQLite database instance
 * @returns {Function} A template tag function for SQL queries
 */
function createQueryTag(db) {
  /**
   * Tagged template function for SQL queries
   *
   * @param {Array<string>} strings - SQL query string parts
   * @param {...any} values - Values to be inserted into the query
   * @returns {Array<object>} Query results
   */
  function query(strings, ...values) {
    // Construct the SQL query
    const sql = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? '?' : '')
    }, '')

    // Create the statement with the parameterized query
    const stmt = db.prepare(sql)

    try {
      // Bind all parameters if we have any
      if (values.length > 0) {
        return stmt.all(...values)
      }
      
      return stmt.all()
    } finally {
      // No need to finalize in this API
    }
  }

  return query
}

/**
 * Extends a Database instance with a query tagged template function
 *
 * @param {sqlite.DatabaseSync} db - SQLite database instance
 * @returns {sqlite.DatabaseSync} Enhanced database with query tag method
 */
function addQueryTag(db) {
  // Add the query tagged template method to the database instance
  db.query = createQueryTag(db)
  return db
}

/**
 * Opens a database and adds the query tagged template function
 *
 * @param {string|URL|Buffer} path - Database filename
 * @param {Object} [options] - Database open options
 * @returns {sqlite.DatabaseSync} Enhanced database with query tag
 */
function open(path, options = {}) {
  const db = new sqlite.DatabaseSync(path, options)
  return addQueryTag(db)
}

module.exports = {
  open,
  addQueryTag,
  createQueryTag
}
