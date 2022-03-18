/* eslint-disable unicorn/filename-case */
exports.shorthands = undefined

exports.up = async pgm => {
  await pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE "users" (
      "id" SERIAL PRIMARY KEY,
      "name" varchar UNIQUE NOT NULL,
      "email" varchar UNIQUE NOT NULL,
      "password_hash" varchar NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT (now())
    );
  `)
}

exports.down = async pgm => {
  await pgm.sql(`
    DROP TABLE "users";
  `)
}
