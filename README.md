# learning-inventory
 
Sistema de gestión de inventario desarrollado como proyecto de aprendizaje de bases de datos relacionales, backend con Next.js y despliegue en la nube.

## 🚀 Demo en producción

**URL:** https://learning-inventory-phn5oh6fw-juanmiguelgins-projects.vercel.app/
 
---
 
## ¿Qué había que hacer?
 
El objetivo del proyecto era construir un sistema de inventario completo desde cero, pasando por todas las capas de una aplicación web moderna:
 
1. **Diseñar una base de datos relacional** con PostgreSQL: crear las tablas, definir sus relaciones mediante claves foráneas, y proteger la integridad de los datos con constraints.
2. **Poblar y consultar la base de datos** con sentencias SQL reales: inserciones, actualizaciones, borrados y consultas con JOIN y GROUP BY.
3. **Construir un backend seguro** con Next.js que se conecte a la base de datos y exponga una API REST, usando consultas parametrizadas para prevenir inyecciones SQL.
4. **Crear un frontend en React** que consuma la API y muestre los datos en una tabla interactiva.
5. **Desplegar todo en producción** con Vercel y Neon, con variables de entorno correctamente configuradas.
6. **Documentar** las decisiones arquitectónicas, el análisis SQL y las medidas de seguridad implementadas.
---
 
## Tecnologías utilizadas
 
| Tecnología | Para qué se usa |
|---|---|
| **PostgreSQL** | Motor de base de datos relacional |
| **Neon** | Hosting serverless de PostgreSQL (sin gestionar servidores) |
| **Next.js 15** | Framework fullstack: frontend React + API Routes en el mismo proyecto |
| **TypeScript** | Tipado estático para detectar errores antes de ejecutar el código |
| **Tailwind CSS** | Estilos del frontend sin escribir CSS manual |
| **@neondatabase/serverless** | Driver oficial para conectar Next.js con Neon vía HTTP |
| **Vercel** | Despliegue automático del proyecto en la nube |
| **Git + GitHub** | Control de versiones y repositorio remoto |
 
---
 
## Estructura del proyecto
 
```
learning-inventory/
│
├── app/                          # App Router de Next.js
│   ├── api/
│   │   └── products/
│   │       └── route.ts          # GET y POST /api/products (SQL puro + parámetros preparados)
│   └── page.tsx                  # Página principal → renderiza ProductList
│
├── components/
│   └── ProductList.tsx           # Componente React: tabla de inventario con estados de carga/error
│
├── lib/
│   └── db.ts                     # Cliente Neon (singleton), conexión a la base de datos
│
├── sql/
│   ├── schema.sql                # DDL: CREATE TABLE categories y products con constraints
│   └── seed.sql                  # DML: INSERT de datos, UPDATE de stock, DELETE, y queries de análisis
│
├── docs/
│   ├── arquitectura-datos.md     # Qué es una FK, ON DELETE CASCADE vs RESTRICT, diagrama ER
│   ├── analisis-sql.md           # INNER JOIN vs LEFT JOIN con escenarios reales
│   └── seguridad-db.md           # SQL Injection, consultas parametrizadas y otras medidas
│
├── .env.local                    # Variables de entorno locales (NO está en Git)
├── .gitignore                    # Excluye node_modules, .env.local, .next, etc.
└── README.md                     # Este archivo
```
 
---
 
## Base de datos
 
### Tablas
 
**`categories`** — Categorías de productos
- `id` UUID (clave primaria, generada automáticamente)
- `name` VARCHAR(100) único y obligatorio
- `description` TEXT opcional
- `created_at` TIMESTAMP automático
**`products`** — Productos del inventario
- `id` UUID (clave primaria)
- `name` VARCHAR(150) obligatorio
- `price` NUMERIC(10,2) con constraint `price > 0`
- `stock` INTEGER con valor por defecto 0 y constraint `stock >= 0`
- `category_id` UUID → Foreign Key a `categories.id` con `ON DELETE RESTRICT`
- `created_at` TIMESTAMP automático
### Decisión de diseño: ON DELETE RESTRICT
 
Se eligió `ON DELETE RESTRICT` en lugar de `ON DELETE CASCADE` porque en un sistema de inventario los productos son el activo central. Si alguien intenta borrar una categoría que tiene productos, la base de datos lanza un error y obliga al operador a reasignar o eliminar los productos primero de forma consciente, evitando pérdidas de datos accidentales.
 
---
 
## API
 
### `GET /api/products`
Devuelve todos los productos con su categoría usando un `INNER JOIN`.
 
### `POST /api/products`
Crea un nuevo producto. Usa consultas parametrizadas para prevenir SQL Injection.
 
---
 
## Seguridad
 
Toda inserción y consulta filtrada usa **consultas parametrizadas**: la query y los datos del usuario viajan por canales separados al motor de base de datos, lo que hace imposible que un atacante inyecte SQL arbitrario.
 
```typescript
// ✅ Seguro: el driver separa query y datos
const [newProduct] = await sql`
  INSERT INTO products (name, price, stock, category_id)
  VALUES (${name}, ${price}, ${stock}, ${category_id})
  RETURNING *
`;
```
 
La `DATABASE_URL` con las credenciales de la base de datos reside únicamente en `.env.local` (local) y en las variables de entorno de Vercel (producción), nunca en el código fuente.
 
---
 
## Despliegue
 
El proyecto está desplegado en **Vercel**, conectado al repositorio de GitHub. Cada `git push` a la rama `main` dispara un despliegue automático. La variable `DATABASE_URL` está configurada en las variables de entorno de Vercel para conectar con la base de datos de Neon en producción.