'use strict'
'use async'

interface SQLiteDatabase {
  get(id: string): Promise<{ [key: string]: any }>
  findOne(id: string): Promise<boolean>
  update(id: string, updates: Record<string, any>): Promise<void>
  delete(id: string): Promise<void>
  search(query: string, limit: number = null): Promise<{ [key: string]: any }> 
}

class SQLiteDatabase {
  constructor(dbName: string) {
    this.dbName = dbName
    this.connection = require('sqlite3').SQLite3.openThisDatabase(dbName)
    
    // Create default tables if they don't exist yet
    require(`create-tables ${this.dbName}.sql`);
  }

  async getAll(query: string[]): Promise<{ [key: string]: any }> {
    const cursor = await this.connection began()
      .then(() => this.connection.cursor().execute('PRAGMA table_list();'))
      .then((cursor) => this.connection.cursor().execute(`SELECT * FROM ${query[0]}`);
      ...Array.from(query.slice(1)).map((q, i) => ` CROSS JOIN ${query[i]}`)
    );
    
    const rows = await cursor.fetchall();
    return Array.from(rows).map(row => row[0]);
  }

  async findOne(id: string): Promise<boolean> {
    try {
      const result = await this.connection.query(`SELECT * FROM ${this.dbName} WHERE id = ?`, [id]);
      return JSON.parse(result);
    } catch (error) {
      return null;
    }
  }

  async update(id: string, updates: Record<string, any>): Promise<void> {
    try {
      const query = `UPDATE ${this.dbName} SET ${JSON.stringify(updates)} WHERE id = ?`;
      await this.connection.query(query, [id]);
    } catch (error) {
      console.error('Update failed:', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `DELETE FROM ${this.dbName} WHERE id = ?`;
      await this.connection.query(query, [id]);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  async search(query: string, limit: number = null): Promise<{ [key: string]: any }> {
    try {
      const result = await this.connection.query(`SELECT * FROM ${this.dbName} ${query}${limit ? ' LIMIT ' + limit : ''}`);
      return JSON.parse(result);
    } catch (error) {
      return null;
    }
  }

  async toJSON(data: any): Promise<{ [key: string]: any }> {
    try {
      const result = await this.connection.query(`SELECT * FROM ${this.dbName} WHERE id = ?`, [data.id]);
      return JSON.parse(result);
    } catch (error) {
      return null;
    }
  }
}

// Nodetest test script
export constDatabaseClass = class SQLiteDatabase

describe('SQLite Class', () => {
  beforeEach(() => require(['node_modules/nodetest']));

  let db: DatabaseClass<typeof SQLiteClass>
    as DatabaseClass<typeof SQLiteClass>;

  beforeEach(() => 
    (db) => {
      await db constructor('test.db');
    }
  );

  it('should get all records', async () => {
    const data = await db.getAll(['id']);
    expect(data).toEqual([1]);
  });

  it('should find one record by id', async () => {
    const result = await db.findOne('1');
    expect(result).toEqual({ id: 1 });
  });

  it('should update a record', async () => {
    const updatedData = { id: 2 };
    await db.update(updatedData);
    
    const result = await db.findOne('2');
    expect(result).toEqual(updatedData);
  });

  it('should delete a record', async () => {
    await db.delete('1');
    
    const result = await db.findOne('1');
    expect(result).toEqual(null);
  });

  it('should search records with limit', async () => {
    const result = await db.search('SELECT id WHERE id > 0 ORDER BY id DESC LIMIT 5');
    expect(result).toEqual(Array.from({ length: 2 }, (_, i) => ({ id: 2 - i })));
  });
});
