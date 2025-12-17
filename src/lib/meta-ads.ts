
const META_ACCESS_TOKEN = "EAAL7Hc8zKP0BQMwWpZBHdZBzf0ZBfdAmKYlY9dFy857fcYz0iNchJtUqE4ZCuU4WiYDjr9TghgzUUZAQk1oy940yjR1ilvFkfh65ZArH5206CGsoGNOWVhWVztHtUhcWR3LzZCzpIYjGePvdPHZB48NfLg6AwjtxGoEV9kQUmSIaiwZBlFgOujHhw7DSN6y5ZB8ndkhgZDZD";
const META_AD_ACCOUNT_ID = "act_367016127239121";

export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    start_time?: string;
    stop_time?: string;
    ui_status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'UNKNOWN';
}

export interface MetaInsight {
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    ctr: number;
    date_start: string;
    date_stop: string;
}

export interface MetaAdsData {
    campaigns: MetaCampaign[];
    insights: MetaInsight; // Aggregated for the account
    campaignInsights: Record<string, MetaInsight>; // Per campaign
}

/**
 * Fetch insights for the Ad Account
 */
async function getAccountInsights(timeRange: string = 'last_30d'): Promise<MetaInsight> {
    const fields = "spend,impressions,clicks,cpc,ctr,date_start,date_stop";
    const url = `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/insights?fields=${fields}&date_preset=${timeRange}&access_token=${META_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        const data = await response.json();

        if (data.error) {
            console.error("Meta Ads API Error (Account Insights):", data.error);
            return { spend: 0, impressions: 0, clicks: 0, cpc: 0, ctr: 0, date_start: '', date_stop: '' };
        }

        if (data.data && data.data.length > 0) {
            const i = data.data[0];
            return {
                spend: parseFloat(i.spend || 0),
                impressions: parseInt(i.impressions || 0),
                clicks: parseInt(i.clicks || 0),
                cpc: parseFloat(i.cpc || 0),
                ctr: parseFloat(i.ctr || 0),
                date_start: i.date_start,
                date_stop: i.date_stop
            };
        }

        return { spend: 0, impressions: 0, clicks: 0, cpc: 0, ctr: 0, date_start: '', date_stop: '' };
    } catch (error) {
        console.error("Meta Ads API Fetch Error:", error);
        return { spend: 0, impressions: 0, clicks: 0, cpc: 0, ctr: 0, date_start: '', date_stop: '' };
    }
}

/**
 * Fetch Active Campaigns
 */
async function getActiveCampaigns(): Promise<MetaCampaign[]> {
    const fields = "id,name,status,objective,start_time,stop_time";
    const url = `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/campaigns?fields=${fields}&effective_status=['ACTIVE','PAUSED']&limit=50&access_token=${META_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        const data = await response.json();

        if (data.error) {
            console.error("Meta Ads API Error (Campaigns):", data.error);
            return [];
        }

        return data.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            objective: c.objective,
            start_time: c.start_time,
            stop_time: c.stop_time,
            ui_status: c.status // Map this better if needed
        }));
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

/**
 * Fetch insights for a specific campaign
 */
async function getCampaignInsights(campaignId: string, timeRange: string = 'last_30d'): Promise<MetaInsight | null> {
    const fields = "spend,impressions,clicks,cpc,ctr";
    const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=${fields}&date_preset=${timeRange}&access_token=${META_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const i = data.data[0];
            return {
                spend: parseFloat(i.spend || 0),
                impressions: parseInt(i.impressions || 0),
                clicks: parseInt(i.clicks || 0),
                cpc: parseFloat(i.cpc || 0),
                ctr: parseFloat(i.ctr || 0),
                date_start: i.date_start,
                date_stop: i.date_stop
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Main function to get dashboard data
 */
export async function getMetaAdsData(): Promise<MetaAdsData> {
    const insights = await getAccountInsights();
    const campaigns = await getActiveCampaigns();

    // Fetch insights for each campaign in parallel
    const campaignInsights: Record<string, MetaInsight> = {};

    // Limit to first 10 active campaigns to avoid rate limits
    const targetCampaigns = campaigns.slice(0, 10);

    await Promise.all(targetCampaigns.map(async (c) => {
        const ins = await getCampaignInsights(c.id);
        if (ins) {
            campaignInsights[c.id] = ins;
        }
    }));

    return {
        campaigns,
        insights,
        campaignInsights
    };
}
