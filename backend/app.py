from flask import Flask, request, jsonify
from flask_cors import CORS
from google.ads.googleads.client import GoogleAdsClient
from transformers import pipeline
import uuid

app = Flask(__name__)
CORS(app)
# Initialize Google Ads client (ensure your credentials are set up properly)
CLIENT = GoogleAdsClient.load_from_storage("backend/google-ads.yaml")

# Load NLP Model for keyword generation
keyword_generator = pipeline("text-generation", model="gpt2")

def generate_keywords(business_name, industry, services):
    """Generates ad keywords using NLP."""
    prompt = f"Generate Google Ads keywords for a {industry} business named {business_name} offering {services}."
    keywords = keyword_generator(
    prompt, max_length=30, truncation=True, num_return_sequences=1
)[0]["generated_text"]
    
    # Extract words and format them as keywords
    keywords_list = [kw.strip() for kw in keywords.split(",") if len(kw) > 2]
    return list(set(keywords_list))[:10]  # Return unique top 10 keywords

def create_campaign(client, customer_id, budget):
    """Creates a Google Ads campaign."""
    campaign_service = client.get_service("CampaignService")
    campaign_operation = client.get_type("CampaignOperation")
    
    campaign = campaign_operation.create
    campaign.name = f"Automated Campaign {uuid.uuid4()}"
    campaign.status = client.enums.CampaignStatusEnum.PAUSED
    campaign.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    campaign.campaign_budget = budget
    campaign.manual_cpc.enhanced_cpc_enabled = True
    response = campaign_service.mutate_campaigns(
        customer_id=customer_id, operations=[campaign_operation]
    )
    return response.results[0].resource_name

def create_ad_group(client, customer_id, campaign_id):
    """Creates an ad group within a campaign."""
    ad_group_service = client.get_service("AdGroupService")
    ad_group_operation = client.get_type("AdGroupOperation")
    
    ad_group = ad_group_operation.create
    ad_group.name = f"Ad Group {uuid.uuid4()}"
    ad_group.campaign = campaign_id
    ad_group.status = client.enums.AdGroupStatusEnum.ENABLED
    ad_group.cpc_bid_micros = 1000000  # 1 USD per click

    response = ad_group_service.mutate_ad_groups(
        customer_id=customer_id, operations=[ad_group_operation]
    )
    return response.results[0].resource_name

def add_keywords(client, customer_id, ad_group_id, keywords):
    """Adds keywords to the ad group."""
    ad_group_criterion_service = client.get_service("AdGroupCriterionService")
    operations = []

    for keyword in keywords:
        operation = client.get_type("AdGroupCriterionOperation")
        criterion = operation.create
        criterion.ad_group = ad_group_id
        criterion.keyword.text = keyword
        criterion.keyword.match_type = client.enums.KeywordMatchTypeEnum.EXACT
        criterion.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
        operations.append(operation)

    response = ad_group_criterion_service.mutate_ad_group_criteria(
        customer_id=customer_id, operations=operations
    )
    return [result.resource_name for result in response.results]

@app.route('/create-campaign', methods=['POST'])
def create_campaign_api():
    try:
        print("Worked")
        data = request.get_json()
        customer_id = data.get("customer_id")
        business_name = data.get("business_name")
        industry = data.get("industry")
        services = data.get("services")
        budget_amount = data.get("budget", 500000)  # Default 500,000 micros (0.50 USD)

        if not all([customer_id, business_name, industry, services]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Step 1: Generate Keywords
        keywords = generate_keywords(business_name, industry, services)

        # Step 2: Create Campaign Budget
        campaign_budget_service = CLIENT.get_service("CampaignBudgetService")
        budget_operation = CLIENT.get_type("CampaignBudgetOperation")
        budget = budget_operation.create
        budget.name = f"Budget {uuid.uuid4()}"
        budget.delivery_method = CLIENT.enums.BudgetDeliveryMethodEnum.STANDARD
        budget.amount_micros = budget_amount
        print("Worked Till Here")
        budget_response = campaign_budget_service.mutate_campaign_budgets(
            customer_id=customer_id, operations=[budget_operation]
        )
        print(budget_response)
        budget_id = budget_response.results[0].resource_name
        print(budget_id)
        print("Ye bhi")
        # Step 3: Create Campaign
        campaign_id = create_campaign(CLIENT, customer_id, budget_id)
        print("Aur Ye Bhi")
        # Step 4: Create Ad Group
        #ad_group_id = create_ad_group(CLIENT, customer_id, campaign_id)

        # Step 5: Add Keywords
        #keyword_ids = add_keywords(CLIENT, customer_id, ad_group_id, keywords)

        return jsonify({
            "status": "success",
            "campaign_id": campaign_id,
           # "ad_group_id": ad_group_id,
           # "keywords_added": keywords
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
