import { NextRequest, NextResponse } from "next/server";

const WOO_URL = "https://www.goontheroad.it";
const WOO_CK = "ck_8564a77bc2541057ecccba217959e4ce6cbc1b76";
const WOO_CS = "cs_ad880ebbdb8a5cffeadf669f9e45023b5ce0d579";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    try {
        const body = await request.json();

        // Construct URL
        const url = `${WOO_URL}/wp-json/wc/v3/products/${id}?consumer_key=${WOO_CK}&consumer_secret=${WOO_CS}`;

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const updatedProduct = await response.json();
        return NextResponse.json(updatedProduct);

    } catch (error: any) {
        console.error("Error updating WooCommerce product:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update product" },
            { status: 500 }
        );
    }
}
