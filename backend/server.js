const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const { GoogleAdsApi, enums } = require("google-ads-api");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

app.post("/chatbot", async (req, res) => {
    const { businessName, industry, services, budget } = req.body;
    if (!businessName || !industry || !services || !budget) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const pythonProcess = spawn("python", ["nlp_model.py", businessName, industry, services, budget]);
    let pythonData = "";

    pythonProcess.stdout.on("data", (data) => {
        pythonData += data.toString();
    });

    pythonProcess.on("close", async () => {
        try {
            const output = JSON.parse(pythonData.trim());
            console.log("Python Output:", output);

            if (!Array.isArray(output.keywords)) {
                throw new Error("Invalid keywords format from Python script");
            }

            const campaign = await createGoogleAdsCampaign(businessName, budget, output.keywords);

            res.json({
                campaignStrategy: output.budget_strategy,
                campaignId: campaign.id,
                adGroupId: campaign.adGroupId,
                addedKeywords: campaign.addedKeywords,
            });
        } catch (error) {
            console.error("JSON Parse Error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Invalid response from NLP model" });
            }
        }
    });

    pythonProcess.stderr.on("data", (error) => {
        console.error("Python Error:", error.toString());
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to process request" });
        }
    });
});

async function createGoogleAdsCampaign(name, budgetAmount) {
    // Create a campaign budget
    const campaignBudget = await customer.campaignBudgets.create({
        name: `Budget for ${name}`,
        amount_micros: budgetAmount * 1000000,
        delivery_method: enums.BudgetDeliveryMethod.STANDARD,
    });

    // Create the campaign
    const campaign = await customer.campaigns.create({
        name: `Chatbot Campaign - ${name}`,
        status: enums.CampaignStatus.ENABLED,
        advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
        manual_cpc: { enhanced_cpc_enabled: true },
        campaign_budget: campaignBudget.resource_name,
    });

    // Create an ad group
    const adGroup = await customer.adGroups.create({
        name: `Ad Group - ${name}`,
        campaign_id: campaign.id,
        status: enums.AdGroupStatus.ENABLED,
    });

    return {
        campaignId: campaign.id,
        adGroupId: adGroup.id,
    };
}



const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
