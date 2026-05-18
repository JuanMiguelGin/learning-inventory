-- ============================================================
-- SEED: datos de ejemplo para learning-inventory
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Insertar categorías
-- Usamos texto literal como ID para facilitar las referencias
-- en los INSERTs de productos de abajo
-- ------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Electrónica',   'Dispositivos tecnológicos y gadgets'),
  ('a1000000-0000-0000-0000-000000000002', 'Hogar',         'Muebles, decoración y electrodomésticos'),
  ('a1000000-0000-0000-0000-000000000003', 'Deportes',      'Material deportivo y ropa técnica'),
  ('a1000000-0000-0000-0000-000000000004', 'Alimentación',  'Productos frescos y envasados');

-- ------------------------------------------------------------
-- Insertar productos
-- Cada producto referencia una categoría existente
-- ------------------------------------------------------------
INSERT INTO products (name, price, stock, category_id) VALUES
  -- Electrónica
  ('Auriculares Bluetooth XM5',  199.99, 45, 'a1000000-0000-0000-0000-000000000001'),
  ('Tablet Pro 11"',             549.00, 12, 'a1000000-0000-0000-0000-000000000001'),
  ('Ratón inalámbrico Ergo',      39.95, 80, 'a1000000-0000-0000-0000-000000000001'),
  ('Teclado mecánico TKL',        89.99, 30, 'a1000000-0000-0000-0000-000000000001'),

  -- Hogar
  ('Sofá 3 plazas Nordic',       699.00,  8, 'a1000000-0000-0000-0000-000000000002'),
  ('Lámpara de pie Arco',         99.50, 22, 'a1000000-0000-0000-0000-000000000002'),
  ('Cafetera espresso automática',249.00, 15, 'a1000000-0000-0000-0000-000000000002'),

  -- Deportes
  ('Zapatillas trail running',   129.95, 60, 'a1000000-0000-0000-0000-000000000003'),
  ('Bicicleta de montaña 29"',   850.00,  5, 'a1000000-0000-0000-0000-000000000003'),
  ('Mochila hidratación 20L',     55.00, 35, 'a1000000-0000-0000-0000-000000000003'),

  -- Alimentación
  ('Aceite de oliva virgen 5L',   28.90, 100, 'a1000000-0000-0000-0000-000000000004'),
  ('Pack café arábica 1kg',       18.50, 200, 'a1000000-0000-0000-0000-000000000004');

-- ------------------------------------------------------------
-- Simular una venta: restamos 3 unidades de "Tablet Pro 11"
-- Usamos una subquery para no depender del UUID exacto
-- ------------------------------------------------------------
UPDATE products
SET stock = stock - 3
WHERE name = 'Tablet Pro 11"';

-- ------------------------------------------------------------
-- Eliminar un producto descatalogado
-- ------------------------------------------------------------
DELETE FROM products
WHERE name = 'Ratón inalámbrico Ergo';

-- ------------------------------------------------------------
-- CONSULTA 1: INNER JOIN
-- Devuelve cada producto con su precio y nombre de categoría.
-- INNER JOIN → solo productos que TIENEN categoría (todos en este caso).
-- Si un producto no tuviera category_id válido, quedaría EXCLUIDO.
-- ------------------------------------------------------------
SELECT
  p.name        AS producto,
  p.price       AS precio,
  p.stock       AS stock,
  c.name        AS categoria
FROM products p
INNER JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.price DESC;

-- ------------------------------------------------------------
-- CONSULTA 2: GROUP BY + COUNT
-- Cuenta cuántos productos tiene cada categoría.
-- LEFT JOIN → incluye categorías SIN productos (mostraría 0).
-- ------------------------------------------------------------
SELECT
  c.name        AS categoria,
  COUNT(p.id)   AS total_productos
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.name
ORDER BY total_productos DESC;
