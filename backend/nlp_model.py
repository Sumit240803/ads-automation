import sys
import spacy
import json  

nlp = spacy.load("en_core_web_sm")

business_name = sys.argv[1]
industry = sys.argv[2]
services = sys.argv[3]
budget = sys.argv[4]

doc = nlp(f"{business_name} is in {industry} industry, offering {services} with a budget of {budget}.")
keywords = list(set(token.text.lower() for token in doc if token.is_alpha and not token.is_stop))

response = {
    "keywords": keywords,  
    "budget_strategy": f"Allocate {budget} efficiently based on keyword performance.",
}

print(json.dumps(response))  # ✅ Ensure JSON output
