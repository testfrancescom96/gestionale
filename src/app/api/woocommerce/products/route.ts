import { NextRequest, NextResponse } from "next/server";

const WOO_URL = "https://www.goontheroad.it";
const WOO_CK = "ck_8564a77bc2541057ecccba217959e4ce6cbc1b76";
const WOO_CS = "cs_ad880ebbdb8a5cffeadf669f9e45023b5ce0d579";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "20";
    const search = searchParams.get("search");

    try {
        const queryParams = new URLSearchParams({
            page,
            per_page,
            consumer_key: WOO_CK,
            consumer_secret: WOO_CS,
        });

        if (search) {
            queryParams.append("search", search);
        }

        const response = await fetch(`${WOO_URL}/wp-json/wc/v3/products?${queryParams.toString()}`, {
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`WooCommerce API Error: ${response.statusText}`);
        }

        const products = await response.json();
        const totalProducts = response.headers.get("x-wp-total");
        const totalPages = response.headers.get("x-wp-totalpages");

        return NextResponse.json({
            products,
            pagination: {
                total: totalProducts,
                totalPages: totalPages,
            }
        });

    } catch (error) {
        console.error("Error fetching WooCommerce products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products from WooCommerce" },
            { status: 500 }
        );
    }
}
