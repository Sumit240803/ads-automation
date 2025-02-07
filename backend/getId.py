from google.ads.googleads.client import GoogleAdsClient

# Load credentials
client = GoogleAdsClient.load_from_storage("backend/google-ads.yaml")

# Fetch customer accounts
def get_customer_accounts(client):
    customer_service = client.get_service("CustomerService")
    response = customer_service.list_accessible_customers()
    print("Accessible Customer IDs:")
    for resource_name in response.resource_names:
        print(resource_name)
get_customer_accounts(client)

