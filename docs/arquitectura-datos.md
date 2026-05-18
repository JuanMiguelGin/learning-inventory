# Arquitectura de Datos — learning-inventory

## ¿Qué es una Foreign Key y por qué importa?

Una **foreign key** (clave foránea) es una columna de una tabla que apunta a la
clave primaria de otra tabla. En nuestro caso:

```
products.category_id  →  categories.id
```

Esto significa que **cada fila de `products` debe referenciar una categoría que
ya exista en `categories`**. El motor de base de datos comprueba esto en cada
`INSERT` y `UPDATE`, haciendo imposible crear un producto con una categoría
inexistente. Sin esta restricción, podríamos tener "productos huérfanos" con
`category_id` apuntando a una categoría que fue borrada, y nuestras consultas
JOIN devolverían datos rotos o incompletos.

### Beneficios concretos

| Sin FK | Con FK |
|---|---|
| Podemos insertar un producto con category_id inventado | El motor rechaza el INSERT con error |
| Al borrar una categoría, los productos quedan huérfanos | El motor impide el borrado si hay productos |
| La coherencia depende de la lógica de la aplicación | La coherencia la garantiza la base de datos |

---

## ON DELETE CASCADE vs ON DELETE RESTRICT

Cuando intentamos eliminar una categoría que tiene productos asociados, la base
de datos debe decidir qué hacer con esos productos. Hay dos comportamientos
principales:

### ON DELETE CASCADE

```sql
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
```

Al borrar una categoría, **se borran automáticamente todos sus productos**.

**Cuándo usarlo:** relaciones de "existencia dependiente", como un carrito de
compra y sus líneas de pedido. Si eliminas el carrito, tiene sentido que
desaparezcan sus líneas.

**Riesgo en inventario:** Si alguien borra accidentalmente la categoría
"Electrónica", perderíamos decenas de productos con su precio e historial.
**No es recuperable** sin una copia de seguridad.

### ON DELETE RESTRICT ✅ (opción elegida)

```sql
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
```

Al intentar borrar una categoría con productos, el motor **lanza un error y
cancela la operación**.

```
ERROR: update or delete on table "categories" violates foreign key constraint
"fk_category" on table "products"
```

**Por qué es más seguro en este contexto:**

1. **Protección contra errores humanos.** Nadie puede borrar datos críticos por
   accidente. El error fuerza al operador a reasignar o eliminar los productos
   primero, de forma consciente.

2. **Auditable.** Cualquier borrado de categoría requiere una acción deliberada
   previa, dejando un rastro en los logs.

3. **Principio de mínimo impacto.** En un sistema de inventario, los productos
   son el activo central. Perder un producto es peor que no poder borrar una
   categoría.

### Flujo correcto para borrar una categoría con RESTRICT

```sql
-- Paso 1: reasignar productos a otra categoría
UPDATE products
SET category_id = '<id-de-categoria-destino>'
WHERE category_id = '<id-categoria-a-borrar>';

-- Paso 2: ahora sí podemos borrar (ya no tiene productos)
DELETE FROM categories WHERE id = '<id-categoria-a-borrar>';
```

---

## Diagrama entidad-relación

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│        categories        │         │           products            │
├─────────────────────────┤         ├──────────────────────────────┤
│ id          UUID  PK    │◄────────│ id           UUID  PK        │
│ name        VARCHAR(100)│  1 : N  │ name         VARCHAR(150)    │
│ description TEXT        │         │ price        NUMERIC(10,2)   │
│ created_at  TIMESTAMP   │         │ stock        INTEGER         │
└─────────────────────────┘         │ category_id  UUID  FK        │
                                    │ created_at   TIMESTAMP       │
                                    └──────────────────────────────┘
```

Una categoría puede tener **muchos productos** (1:N).
Un producto pertenece a **exactamente una categoría**.
