// app/api/products/route.ts
// ============================================================
// API Route de Next.js (App Router)
// GET  /api/products  → lista todos los productos con su categoría
// POST /api/products  → crea un nuevo producto
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

// ------------------------------------------------------------------
// GET — Obtener todos los productos con su categoría
//
// Usamos INNER JOIN porque solo queremos productos con categoría válida.
// ORDER BY category name y luego price para una lista organizada.
// ------------------------------------------------------------------
export async function GET() {
  try {
    const products = await sql`
      SELECT
        p.id,
        p.name,
        p.price,
        p.stock,
        p.created_at,
        c.name        AS category_name,
        c.description AS category_description
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      ORDER BY c.name ASC, p.price DESC
    `;

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error al obtener los productos" },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// POST — Crear un nuevo producto
//
// ¡SEGURIDAD CRÍTICA!
// Usamos consultas PARAMETRIZADAS (también llamadas "prepared statements").
//
// ❌ MAL (vulnerable a SQL Injection):
//   const query = `INSERT INTO products (name) VALUES ('${body.name}')`;
//   Si body.name = "test'); DROP TABLE products;--"
//   → el atacante ejecuta SQL arbitrario en tu base de datos
//
// ✅ BIEN (con parámetros):
//   sql`INSERT INTO products (name) VALUES (${body.name})`
//   El driver de Neon envía la query y los valores por SEPARADO.
//   El motor los trata siempre como datos, nunca como código SQL.
// ------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación básica de entrada
    const { name, price, stock, category_id } = body;

    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: "name, price y category_id son obligatorios" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "price debe ser un número mayor que 0" },
        { status: 400 }
      );
    }

    // ✅ Consulta parametrizada: cada ${variable} es un parámetro $1, $2...
    // El driver de Neon (tagged template) gestiona el escape automáticamente.
    const [newProduct] = await sql`
      INSERT INTO products (name, price, stock, category_id)
      VALUES (${name}, ${price}, ${stock ?? 0}, ${category_id})
      RETURNING id, name, price, stock, category_id, created_at
    `;

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    // Error de FK: la categoría no existe
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "La categoría indicada no existe" },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
