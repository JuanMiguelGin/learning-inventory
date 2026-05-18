// lib/db.ts
// ============================================================
// Cliente de base de datos — conexión a Neon (PostgreSQL serverless)
//
// Usamos @neondatabase/serverless en lugar del driver estándar pg
// porque Neon ejecuta Postgres sobre HTTP/WebSockets, lo que lo hace
// compatible con entornos serverless (Vercel Edge, Cloudflare Workers)
// donde no existen conexiones TCP persistentes.
//
// El cliente se inicializa UNA sola vez gracias al patrón singleton:
// en desarrollo, Next.js recarga los módulos en cada cambio de código
// (hot reload), y sin este patrón crearíamos decenas de conexiones.
// ============================================================

import { neon } from "@neondatabase/serverless";

// process.env.DATABASE_URL viene del archivo .env.local (local)
// o de las variables de entorno de Vercel (producción).
// Nunca hardcodeamos la URL aquí → seguridad.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está definida. Crea un archivo .env.local con tu connection string de Neon."
  );
}

// neon() devuelve una función SQL tagged-template que envía queries
// a Neon sobre HTTPS. Es la forma más sencilla para queries simples.
const sql = neon(process.env.DATABASE_URL);

export default sql;
