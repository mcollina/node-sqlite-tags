# node-sqlite-tags

Add template tags to [node:sqlite](https://nodejs.org/api/sqlite.html) for convenient and safe SQL querying.

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

// Close the database when done
db.close()
```

## API

### `open(filename, options)`

Opens a SQLite database and adds the query tag functionality.

- `filename`: String, URL, or Buffer - Path to the database file
- `options`: Object - Options for opening the database (see [node:sqlite documentation](https://nodejs.org/api/sqlite.html))
- Returns: DatabaseSync - Enhanced database with query tag method

### `addQueryTag(db)`

Adds the query tag functionality to an existing database instance.

- `db`: DatabaseSync - An existing SQLite database instance
- Returns: DatabaseSync - The same database object with added query tag functionality

### `db.query`

Tagged template function for SQL queries with automatic parameter binding.

- Parameters are automatically extracted from the template and bound safely
- Returns: Array<Object> - Query results as objects

## Testing

Run the tests with:

```sh
npm test
```

## License

MIT
