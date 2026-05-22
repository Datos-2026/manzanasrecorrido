require('dotenv').config();

const ssl = process.env.DATABASE_SSL === 'true'
  ? { require: true, rejectUnauthorized: false }
  : undefined;

const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  dialectOptions: ssl ? { ssl } : {},
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
