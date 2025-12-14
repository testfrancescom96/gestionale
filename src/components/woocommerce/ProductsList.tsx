"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";

export function ProductsList() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/products");
            const data = await res.json();
            if (data.products) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800">Catalogo Prodotti WooCommerce</h3>
                <button
                    onClick={fetchProducts}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    title="Aggiorna Prodotti"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-40 bg-gray-100 flex items-center justify-center">
                            {product.images && product.images[0] ? (
                                <img
                                    src={product.images[0].src}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <ImageIcon className="h-10 w-10 text-gray-400" />
                            )}
                        </div>
                        <div className="p-4">
                            <h4 className="font-medium text-gray-900 line-clamp-2" title={product.name}>
                                {product.name}
                            </h4>
                            <div className="mt-2 flex items-center justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock_status === 'instock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.stock_status === 'instock' ? 'Disponibile' : 'Esaurito'}
                                </span>
                                <span className="font-semibold text-blue-600">
                                    {product.price} {product.currency_symbol}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
