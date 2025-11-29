require('dotenv').config();

module.exports = {
  development: {
    username: 'postgres',
    password: 'anqincoder0822',
    database: 'postgres',
    host: 'db.iroifejpfqurkxkqmpxe.supabase.co',
    port: 5432,
    dialect: 'postgres',
    logging: false
  },
  test: {
    username: 'postgres',
    password: 'anqincoder0822',
    database: 'postgres',
    host: 'db.iroifejpfqurkxkqmpxe.supabase.co',
    port: 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: 'postgres',
    password: 'anqincoder0822',
    database: 'postgres',
    host: 'db.iroifejpfqurkxkqmpxe.supabase.co',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
};
