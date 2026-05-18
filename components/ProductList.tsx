// components/ProductList.tsx
// ============================================================
// Componente React que muestra el inventario de productos.
//
// Flujo:
//   1. Al montar el componente, useEffect llama a /api/products
//   2. Mientras carga, muestra un skeleton
//   3. Si hay error, muestra un mensaje claro
//   4. Si hay datos, renderiza la tabla con productos y categorías
// ============================================================

"use client"; // Directiva Next.js: este componente corre en el navegador

import { useEffect, useState } from "react";

// Tipos TypeScript que reflejan la estructura que devuelve la API
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
  category_name: string;
  category_description: string;
}

interface ApiResponse {
  products: Product[];
}

// Formateo de precio en euros con el locale español
const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);

// Color del badge de stock según disponibilidad
const stockColor = (stock: number) => {
  if (stock === 0) return "bg-red-100 text-red-700";
  if (stock < 10) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // useEffect con array vacío [] → se ejecuta solo una vez al montar
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data: ApiResponse = await res.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false); // Siempre quitamos el loading, haya error o no
      }
    }

    fetchProducts();
  }, []);

  // Estado: cargando
  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Estado: error
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error al cargar productos:</strong> {error}
        </div>
      </div>
    );
  }

  // Estado: sin productos
  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No hay productos en el inventario.
      </div>
    );
  }

  // Estado: datos listos
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Inventario de Productos
        <span className="ml-3 text-sm font-normal text-gray-500">
          {products.length} productos
        </span>
      </h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Producto</th>
              <th className="px-6 py-4 text-left">Categoría</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {product.category_name}
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-800">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${stockColor(product.stock)}`}
                  >
                    {product.stock} uds.
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
