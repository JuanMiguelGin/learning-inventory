# Análisis SQL — INNER JOIN vs LEFT JOIN

## La diferencia fundamental

La diferencia entre `INNER JOIN` y `LEFT JOIN` es **qué ocurre cuando no hay
coincidencia** entre las dos tablas que estamos relacionando.

| | INNER JOIN | LEFT JOIN |
|---|---|---|
| Sin coincidencia | La fila **desaparece** del resultado | La fila aparece con **NULL** en las columnas de la derecha |
| Filas devueltas | Solo las que tienen pareja en ambas tablas | Todas las de la tabla izquierda, pase lo que pase |

---

## INNER JOIN — Solo lo que coincide en ambos lados

```sql
SELECT
  p.name     AS producto,
  p.price    AS precio,
  c.name     AS categoria
FROM products p
INNER JOIN categories c ON p.category_id = c.id;
```

### ¿Qué hace exactamente?

PostgreSQL recorre cada fila de `products` y busca una fila en `categories`
donde `categories.id = products.category_id`. Si encuentra la pareja, incluye
esa fila en el resultado. Si **no** la encuentra (por ejemplo, si el
`category_id` es NULL o apunta a una categoría borrada), esa fila de productos
**no aparece**.

### Escenario del mundo real: factura de una tienda

Queremos imprimir el ticket de una compra. Necesitamos el nombre del producto y
su categoría para cada línea. Si un producto por algún motivo no tiene categoría
asignada, preferimos **no mostrarlo** antes que mostrar una línea incompleta
que confunda al cliente.

```sql
-- Solo muestra productos que tienen categoría válida
SELECT p.name, p.price, c.name AS categoria
FROM products p
INNER JOIN categories c ON p.category_id = c.id
WHERE p.id IN (/* ids del carrito */);
```

**Resultado:** filas limpias y completas. Cero NULLs.

---

## LEFT JOIN — Todo lo de la izquierda, pase lo que pase

```sql
SELECT
  c.name        AS categoria,
  COUNT(p.id)   AS total_productos
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name
ORDER BY total_productos DESC;
```

### ¿Qué hace exactamente?

Toma **todas** las filas de la tabla de la izquierda (`categories`) y para cada
una busca coincidencias en la derecha (`products`). Si hay coincidencia, une
las filas. Si **no** hay coincidencia (una categoría sin productos), igualmente
devuelve la fila de la izquierda, pero con `NULL` en todas las columnas de la
derecha.

### Escenario del mundo real: panel de administración

El administrador quiere ver el estado de todas las categorías, incluyendo las
que están vacías (recién creadas o con todos los productos eliminados). Si
usáramos `INNER JOIN`, esas categorías vacías serían invisibles y el admin
pensaría que no existen.

```sql
-- Muestra TODAS las categorías, incluso las que tienen 0 productos
SELECT
  c.name                    AS categoria,
  COUNT(p.id)               AS total_productos,
  COALESCE(SUM(p.stock), 0) AS stock_total
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name;
```

**Resultado con LEFT JOIN:**
```
categoria      | total_productos | stock_total
---------------|-----------------|------------
Electrónica    |               3 |         137
Hogar          |               3 |          45
Deportes       |               3 |         100
Alimentación   |               2 |         300
```

**Resultado con INNER JOIN** (si una categoría estuviera vacía):
```
-- La categoría vacía simplemente no aparecería → información perdida
```

---

## Regla mnemotécnica

> **INNER JOIN** = "quiero solo los que tienen pareja"  
> **LEFT JOIN** = "quiero todos los de la izquierda, tengan pareja o no"

Usa `INNER JOIN` cuando la ausencia de relación significa que la fila no es útil.  
Usa `LEFT JOIN` cuando necesitas **visibilidad completa** aunque no haya datos relacionados.
