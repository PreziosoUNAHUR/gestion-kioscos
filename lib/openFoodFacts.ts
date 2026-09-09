export interface OpenFoodFactsResult {
  found: boolean;
  nombre: string;
  imagen_url: string | null;
}

export async function buscarEnOpenFoodFacts(codigoBarras: string): Promise<OpenFoodFactsResult> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigoBarras}.json`);
    const data = await res.json();
    if (data.status === 1) {
      const nombreProducto = data.product.product_name || data.product.product_name_es || '';
      const marca = data.product.brands || '';
      const nombreCompleto = marca ? `${marca} ${nombreProducto}`.trim() : nombreProducto;
      return { found: true, nombre: nombreCompleto, imagen_url: data.product.image_url || null };
    }
    return { found: false, nombre: '', imagen_url: null };
  } catch {
    return { found: false, nombre: '', imagen_url: null };
  }
}