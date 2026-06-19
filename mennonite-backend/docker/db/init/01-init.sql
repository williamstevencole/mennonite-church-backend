-- Se ejecuta UNA sola vez, al crear el volumen de Postgres.
-- Prepara lo que GoTrue necesita en la base local.

-- Extensiones usadas por las migraciones de GoTrue.
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Schema donde GoTrue crea sus tablas (auth.users, auth.refresh_tokens, ...).
-- GoTrue corre el resto de sus migraciones al arrancar.
create schema if not exists auth;
