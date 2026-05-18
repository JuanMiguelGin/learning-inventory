# Seguridad en base de datos — SQL Injection y parámetros preparados

## ¿Qué es una inyección SQL?

Una **inyección SQL** (SQL Injection) es una de las vulnerabilidades más
antiguas y peligrosas del desarrollo web. Aparece cuando la aplicación
**construye una query SQL concatenando texto** que incluye entrada del usuario,
permitiendo que un atacante **modifique la lógica de la consulta**.

### Ejemplo de código vulnerable

```typescript
// ❌ VULNERABLE — NO hacer esto nunca
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name"); // valor controlado por el usuario

  // Si name = "'; DROP TABLE products; --"
  // la query resultante es:
  // SELECT * FROM products WHERE name = ''; DROP TABLE products; --'
  // → el atacante acaba de borrar toda la tabla
  const query = `SELECT * FROM products WHERE name = '${name}'`;
  const result = await db.query(query);
  ...
}
```

### Otros payloads habituales de ataque

| Input del atacante | Query resultante | Efecto |
|---|---|---|
| `' OR '1'='1` | `WHERE id = '' OR '1'='1'` | Devuelve TODAS las filas (bypass de autenticación) |
| `'; DROP TABLE users; --` | Ejecuta un DROP TABLE | Destrucción de datos |
| `' UNION SELECT email,password FROM users --` | Une con otra tabla | Exfiltración de contraseñas |
| `' UPDATE users SET role='admin' WHERE '1'='1` | Modifica registros | Escalada de privilegios |

---

## La solución: consultas parametrizadas

Las **consultas parametrizadas** (o prepared statements) separan el código SQL
de los datos. La query y los valores viajan por canales separados al motor de
base de datos. El motor interpreta los parámetros **siempre como datos**, nunca
como fragmentos de SQL.

### Cómo funciona bajo el capó

```
Sin parámetros (vulnerable):
  Aplicación → motor:  "SELECT * FROM users WHERE id = '1 OR 1=1'"
  El motor analiza todo como código SQL ← PELIGRO

Con parámetros (seguro):
  Aplicación → motor:  "SELECT * FROM users WHERE id = $1"   (query)
  Aplicación → motor:  ["1 OR 1=1"]                          (datos)
  El motor trata los datos como texto literal ← SEGURO
```

### Implementación en este proyecto

Usamos el tagged template de `@neondatabase/serverless`. Cualquier variable
dentro de `${}` se convierte automáticamente en un parámetro preparado.

```typescript
// ✅ SEGURO — lib/db.ts + app/api/products/route.ts

// INSERT con parámetros preparados
const [newProduct] = await sql`
  INSERT INTO products (name, price, stock, category_id)
  VALUES (${name}, ${price}, ${stock ?? 0}, ${category_id})
  RETURNING *
`;
// El driver envía:
//   query:  "INSERT INTO products (...) VALUES ($1, $2, $3, $4) RETURNING *"
//   params: [name, price, stock, category_id]
// → Aunque name fuera "test'); DROP TABLE products;--", se trata como texto.

// SELECT filtrado con parámetro
const products = await sql`
  SELECT * FROM products WHERE category_id = ${categoryId}
`;
```

### ¿Por qué los tagged templates son seguros?

```typescript
// Internamente, neon() hace esto:
function sql(strings: TemplateStringsArray, ...values: any[]) {
  // strings = ["SELECT * FROM products WHERE id = ", ""]  (partes fijas)
  // values  = [userId]                                     (datos del usuario)
  
  // Construye: query = "SELECT * FROM products WHERE id = $1"
  // Y envía values como array separado → el motor nunca los evalúa como SQL
}
```

---

## Otras medidas de seguridad implementadas

### 1. Variables de entorno para credenciales

```bash
# .env.local  (NUNCA subir a Git)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

```
# .gitignore
.env.local
.env*.local
```

La `DATABASE_URL` contiene usuario, contraseña y host. Si se sube a GitHub,
cualquiera con acceso al repo tiene control total de la base de datos.

### 2. Validación de entrada antes de la query

```typescript
// Validamos tipos y rangos ANTES de llegar a SQL
if (!name || !price || !category_id) {
  return NextResponse.json({ error: "Campos obligatorios" }, { status: 400 });
}
if (typeof price !== "number" || price <= 0) {
  return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
}
```

### 3. Principio de mínimo privilegio

El usuario de base de datos que usa la aplicación debe tener **solo los
permisos que necesita**. Para una API de inventario:

```sql
-- Crear un usuario de aplicación con permisos limitados
CREATE USER app_inventory WITH PASSWORD 'contraseña_fuerte';

-- Solo SELECT, INSERT, UPDATE, DELETE en las tablas necesarias
GRANT SELECT, INSERT, UPDATE, DELETE ON products, categories TO app_inventory;

-- NO le damos TRUNCATE, DROP, CREATE → no puede destruir el esquema
```

### 4. SSL obligatorio

La cadena de conexión de Neon incluye `?sslmode=require`, lo que garantiza
que todos los datos (incluyendo credenciales) viajan cifrados entre la
aplicación y la base de datos.

---

## Resumen

| Técnica | Protege contra |
|---|---|
| Consultas parametrizadas | SQL Injection |
| Variables de entorno | Exposición de credenciales |
| Validación de entrada | Datos malformados y errores |
| Mínimo privilegio | Daño por credencial comprometida |
| SSL en conexión | Interceptación de datos en tránsito |
