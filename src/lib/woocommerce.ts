
const WOO_URL = "https://www.goontheroad.it";
const WOO_CK = "ck_8564a77bc2541057ecccba217959e4ce6cbc1b76";
const WOO_CS = "cs_ad880ebbdb8a5cffeadf669f9e45023b5ce0d579";

interface WooOrder {
    id: number;
    status: string;
    total: string;
    date_created: string;
    // Add other fields as needed
}

export async function fetchWooOrders(params: URLSearchParams): Promise<any> {
    const queryParams = new URLSearchParams(params);
    queryParams.set("consumer_key", WOO_CK);
    queryParams.set("consumer_secret", WOO_CS);

    const response = await fetch(`${WOO_URL}/wp-json/wc/v3/orders?${queryParams.toString()}`, {
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const total = response.headers.get("x-wp-total");
    const totalPages = response.headers.get("x-wp-totalpages");

    return {
        orders: data,
        total,
        totalPages
    };
}

export async function fetchWooProducts(params: URLSearchParams): Promise<any> {
    const queryParams = new URLSearchParams(params);
    queryParams.set("consumer_key", WOO_CK);
    queryParams.set("consumer_secret", WOO_CS);

    const response = await fetch(`${WOO_URL}/wp-json/wc/v3/products?${queryParams.toString()}`, {
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const total = response.headers.get("x-wp-total");
    const totalPages = response.headers.get("x-wp-totalpages");

    return {
        products: data,
        total,
        totalPages
    };
}

export async function fetchAllWooProducts(params: URLSearchParams): Promise<any[]> {
    let allProducts: any[] = [];
    let page = 1;
    let totalPages = 1;

    // Initial fetch to get total pages
    const initialParams = new URLSearchParams(params);
    initialParams.set("page", "1");
    initialParams.set("per_page", "100");

    const { products, totalPages: total } = await fetchWooProducts(initialParams);
    allProducts = [...products];
    totalPages = parseInt(total || "1");

    // BATCH FETCHING to avoid 500 Errors
    const BATCH_SIZE = 5;
    let currentBatch: Promise<any>[] = [];

    for (let p = 2; p <= totalPages; p++) {
        const pParams = new URLSearchParams(params);
        pParams.set("page", p.toString());
        pParams.set("per_page", "100");

        currentBatch.push(fetchWooProducts(pParams));

        // If batch full or last page, execute
        if (currentBatch.length >= BATCH_SIZE || p === totalPages) {
            const results = await Promise.all(currentBatch);
            results.forEach(res => {
                if (res.products) {
                    allProducts = [...allProducts, ...res.products];
                }
            });
            currentBatch = []; // Reset
            // Small delay to be gentle on server
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return allProducts;
}

export async function fetchAllWooOrders(params: URLSearchParams): Promise<any[]> {
    let allOrders: any[] = [];
    let page = 1;
    let totalPages = 1;

    // Initial fetch to get total pages
    const initialParams = new URLSearchParams(params);
    initialParams.set("page", "1");
    initialParams.set("per_page", "100");

    // We want ALL orders, not just processing/completed, unless specified
    const { orders, totalPages: total } = await fetchWooOrders(initialParams);
    allOrders = [...orders];
    totalPages = parseInt(total || "1");

    // BATCH FETCHING
    const BATCH_SIZE = 5;
    let currentBatch: Promise<any>[] = [];

    for (let p = 2; p <= totalPages; p++) {
        const pParams = new URLSearchParams(params);
        pParams.set("page", p.toString());
        pParams.set("per_page", "100");

        currentBatch.push(fetchWooOrders(pParams));

        if (currentBatch.length >= BATCH_SIZE || p === totalPages) {
            const results = await Promise.all(currentBatch);
            results.forEach(res => {
                if (res.orders) {
                    allOrders = [...allOrders, ...res.orders];
                }
            });
            currentBatch = [];
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return allOrders;
}

/**
 * Fetches all orders within a date range to calculate revenue.
 * Handles pagination recursively or loop.
 * For now, let's assume we fetch a reasonable max quantity or loop.
 */
export async function getWooCommerceRevenue(year: number) {
    const startDate = `${year}-01-01T00:00:00`;
    const endDate = `${year}-12-31T23:59:59`;

    let allOrders: WooOrder[] = [];
    let page = 1;
    let hasMore = true;

    // Safety limit to avoid infinite loops if thousands of orders
    const MAX_PAGES = 10;

    while (hasMore && page <= MAX_PAGES) {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: "100",
            after: startDate,
            before: endDate,
            status: "completed,processing" // Only count confirmed revenue
        });

        const { orders, totalPages } = await fetchWooOrders(params);

        if (orders && orders.length > 0) {
            allOrders = [...allOrders, ...orders];
        }

        if (parseInt(totalPages || "1") > page) {
            page++;
        } else {
            hasMore = false;
        }
    }

    const totalRevenue = allOrders.reduce((acc, order) => {
        return acc + parseFloat(order.total);
    }, 0);

    return {
        revenue: totalRevenue,
        count: allOrders.length
    };
}
