# node-sqlite-tags

Add template tags to [node:sqlite](https://nodejs.org/api/sqlite.html) for convenient and safe SQL querying with built-in LRU caching for prepared statements.

## Installation

```sh
npm install sqlite-tags
```

## Usage

```js
const { open } = require('sqlite-tags')

// Open a database with query tag support
const db = open('mydb.sqlite')

// Create table and insert data
db.exec(`
  CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
  INSERT INTO products VALUES (1, 'Product A', 10.99);
  INSERT INTO products VALUES (2, 'Product B', 24.99);
`)

// Query using tagged template literals
const id = 1
const products = db.query`SELECT * FROM products WHERE id = ${id}`

console.log(products) // [{ id: 1, name: 'Product A', price: 10.99 }]

// Multiple parameters
const minPrice = 15
const category = 'electronics'
const results = db.query`
  SELECT * FROM products 
  WHERE price > ${minPrice} 
  AND category = ${category}
`

// Check cache status
console.log(`Cache size: ${db.query.cacheSize()}`)
console.log(`Cache capacity: ${db.query.cacheCapacity()}`)

// Clear the cache if needed
db.query.clearCache()

// Close the database when done
db.close()
```

## LRU Caching

The module uses an LRU (Least Recently Used) cache to store prepared statements, which improves performance by reusing statements instead of re-preparing them for each query execution. This is especially useful for frequently executed queries.

By default, the cache can store up to 100 prepared statements. You can customize this with the `cacheSize` option.

## API

### `open(filename, options)`

Opens a SQLite database and adds the query tag functionality.

- `filename`: String, URL, or Buffer - Path to the database file
- `options`: Object - Options for opening the database and query tag
  - `cacheSize`: Number - Maximum number of prepared statements to cache (default: 100)
  - ... (and all other standard options from [node:sqlite](https://nodejs.org/api/sqlite.html))
- Returns: DatabaseSync - Enhanced database with query tag method

### `addQueryTag(db, options)`

Adds the query tag functionality to an existing database instance.

- `db`: DatabaseSync - An existing SQLite database instance
- `options`: Object - Configuration options
  - `cacheSize`: Number - Maximum number of prepared statements to cache (default: 100)
- Returns: DatabaseSync - The same database object with added query tag functionality

### `db.query`

Tagged template function for SQL queries with automatic parameter binding.

- Parameters are automatically extracted from the template and bound safely
- Returns: Array<Object> - Query results as objects

### `db.query.clearCache()`

Clears the prepared statement cache.

### `db.query.cacheSize()`

Returns the current number of statements in the cache.

### `db.query.cacheCapacity()`

Returns the maximum capacity of the statement cache.

## Testing

Run the tests with:

```sh
npm test
```

## Performance Impact

Using the LRU cache for prepared statements can significantly improve performance in applications that:

1. Execute the same queries repeatedly
2. Have complex queries that are expensive to parse and prepare
3. Execute queries in tight loops or high-frequency operations

The cache helps avoid the overhead of re-parsing and preparing SQL statements, which can be substantial for complex queries.

## License

MIT
