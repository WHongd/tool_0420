module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
};