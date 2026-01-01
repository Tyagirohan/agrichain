"""
Government Schemes API Scraper with Real-time Translation
Fetches agricultural schemes data and provides Hindi translation
"""

from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
import hashlib
import time

# Cache for translations to avoid repeated API calls
translation_cache = {}

def translate_to_hindi(text: str) -> str:
    """
    Translate English text to Hindi using Google Translate (free)
    Uses caching to avoid repeated translations
    """
    if not text or text.strip() == "":
        return text
    
    # Check cache first
    cache_key = hashlib.md5(text.encode()).hexdigest()
    if cache_key in translation_cache:
        return translation_cache[cache_key]
    
    try:
        translator = GoogleTranslator(source='en', target='hi')
        
        # Split long text if needed (Google Translate has limits)
        max_length = 4500
        if len(text) <= max_length:
            translated = translator.translate(text)
        else:
            # Split and translate in chunks
            chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
            translated_chunks = []
            for chunk in chunks:
                translated_chunks.append(translator.translate(chunk))
                time.sleep(0.3)  # Small delay to avoid rate limiting
            translated = ' '.join(translated_chunks)
        
        # Cache the result
        translation_cache[cache_key] = translated
        return translated
    except Exception as e:
        print(f"Translation error for text: {text[:50]}... - {e}")
        return text  # Return original if translation fails

def translate_scheme(scheme: Dict) -> Dict:
    """
    Translate a scheme's content to Hindi
    Returns a new dict with Hindi translations
    """
    try:
        translated = {
            "name_hi": translate_to_hindi(scheme['name']),
            "description_hi": translate_to_hindi(scheme['description']),
            "benefits_hi": translate_to_hindi(scheme['benefits']),
            "eligibility_hi": [translate_to_hindi(item) for item in scheme['eligibility']],
            "category_hi": translate_to_hindi(scheme['category']),
            "deadline_hi": translate_to_hindi(scheme['deadline']),
        }
        
        # Add small delay to avoid rate limiting
        time.sleep(0.2)
        
        return translated
    except Exception as e:
        print(f"Error translating scheme {scheme.get('name', 'unknown')}: {e}")
        return {}

def fetch_government_schemes(language: str = "en") -> List[Dict]:
    """
    Fetch government schemes from various sources
    In production, this would:
    1. Scrape from pmkisan.gov.in
    2. Fetch from Ministry of Agriculture APIs
    3. Parse data from farmer.gov.in
    4. Aggregate from state government portals
    
    Args:
        language: 'en' for English, 'hi' for Hindi
    
    Returns:
        List of schemes with translations if language='hi'
    """
    
    # Generate dynamic dates based on current date
    current_date = datetime.now()
    kharif_deadline = datetime(current_date.year + 1, 6, 30).strftime("%B %Y")  # Next June
    rabi_deadline = datetime(current_date.year + 1, 1, 31).strftime("%B %Y")  # Next January
    march_deadline = datetime(current_date.year + 1, 3, 31).strftime("%B %Y")  # Next March
    may_deadline = datetime(current_date.year + 1, 5, 31).strftime("%B %Y")  # Next May
    
    # Base scheme data (English)
    # In production, this would be fetched from government APIs
    schemes = [
        {
            "id": "1",
            "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
            "category": "Financial Support",
            "description": "Direct income support to all landholding farmers' families. Rs.6,000 per year in three equal installments of Rs.2,000 each.",
            "eligibility": [
                "Small and marginal farmers",
                "Landholding farmers",
                "All cultivable landholders"
            ],
            "benefits": "Rs.6,000 per year (Rs.2,000 per installment)",
            "deadline": "Ongoing - Register anytime",
            "status": "active",
            "link": "https://pmkisan.gov.in",
            "organization": "Ministry of Agriculture",
            "minLandSize": 0,
            "maxIncome": 200000
        },
        {
            "id": "2",
            "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
            "category": "Insurance",
            "description": "Crop insurance scheme providing financial support in case of crop failure due to natural calamities, pests & diseases.",
            "eligibility": [
                "All farmers growing notified crops",
                "Sharecroppers and tenant farmers",
                "Land owners can also enroll"
            ],
            "benefits": "Up to 90% premium subsidy on insurance",
            "deadline": f"Before Kharif season - {kharif_deadline}",
            "status": "active",
            "link": "https://pmfby.gov.in",
            "organization": "Ministry of Agriculture",
            "minLandSize": 0
        },
        {
            "id": "3",
            "name": "Soil Health Card Scheme",
            "category": "Agricultural Services",
            "description": "Free soil testing and nutrient-based recommendations to improve soil health and productivity.",
            "eligibility": [
                "All farmers",
                "No land size restriction",
                "Available across all states"
            ],
            "benefits": "Free soil testing + personalized fertilizer recommendations",
            "deadline": "Ongoing",
            "status": "active",
            "link": "https://soilhealth.dac.gov.in",
            "organization": "Department of Agriculture",
            "minLandSize": 0
        },
        {
            "id": "4",
            "name": "Kisan Credit Card (KCC)",
            "category": "Credit/Loans",
            "description": "Easy access to credit for farmers at subsidized interest rates for agricultural and allied activities.",
            "eligibility": [
                "All farmers (owner/tenant)",
                "Sharecroppers",
                "Self-help groups"
            ],
            "benefits": "Interest subvention up to 2%, credit limit up to Rs.3 lakh",
            "deadline": "Ongoing",
            "status": "active",
            "link": "https://www.india.gov.in/spotlight/kisan-credit-card-scheme",
            "organization": "NABARD",
            "minLandSize": 0.1
        },
        {
            "id": "5",
            "name": "PKVY (Paramparagat Krishi Vikas Yojana)",
            "category": "Organic Farming",
            "description": "Promotion of organic farming through cluster approach and PGS certification.",
            "eligibility": [
                "Farmers interested in organic farming",
                "Must form groups of 50 or more",
                "All crops eligible"
            ],
            "benefits": "Rs.50,000 per hectare for 3 years + certification support",
            "deadline": f"Application open - {march_deadline}",
            "status": "active",
            "link": "https://pgsindia-ncof.gov.in",
            "organization": "Ministry of Agriculture",
            "minLandSize": 1
        },
        {
            "id": "6",
            "name": "National Agriculture Market (e-NAM)",
            "category": "Marketing",
            "description": "Pan-India electronic trading portal for agricultural commodities ensuring transparent price discovery.",
            "eligibility": [
                "All registered farmers",
                "Must have valid ID proof",
                "Bank account required"
            ],
            "benefits": "Direct market access + transparent pricing + online payment",
            "deadline": "Ongoing - Register anytime",
            "status": "active",
            "link": "https://www.enam.gov.in",
            "organization": "Small Farmers Agribusiness Consortium",
            "minLandSize": 0
        },
        {
            "id": "7",
            "name": "PM Kusum (Solar Pump Subsidy)",
            "category": "Energy/Infrastructure",
            "description": "Financial support for installation of solar pumps and solarization of grid-connected agriculture pumps.",
            "eligibility": [
                "All farmers",
                "Farmer groups",
                "Cooperatives"
            ],
            "benefits": "Up to 60% subsidy on solar pump installation",
            "deadline": f"Phase 2 - Applications till {may_deadline}",
            "status": "active",
            "link": "https://www.india.gov.in/spotlight/pm-kusum",
            "organization": "Ministry of New and Renewable Energy",
            "minLandSize": 0.5,
            "maxIncome": 300000
        },
        {
            "id": "8",
            "name": "Micro Irrigation Fund",
            "category": "Water Conservation",
            "description": "Support for installing drip and sprinkler irrigation systems under PMKSY.",
            "eligibility": [
                "All farmers",
                "Farmer producer organizations",
                "State governments can apply"
            ],
            "benefits": "50-90% subsidy based on farmer category",
            "deadline": "Ongoing",
            "status": "active",
            "link": "https://pmksy.gov.in",
            "organization": "NABARD",
            "minLandSize": 0.2
        }
    ]
    
    # If Hindi requested, add translations to each scheme
    if language == "hi":
        print(f"Translating {len(schemes)} schemes to Hindi...")
        for scheme in schemes:
            translations = translate_scheme(scheme)
            scheme.update(translations)  # Add Hindi fields to scheme
        print("Translation completed!")
    
    return schemes

def search_schemes(query: str = "", category: str = "all", language: str = "en") -> List[Dict]:
    """Search schemes by query and category with language support"""
    all_schemes = fetch_government_schemes(language)
    
    if query:
        query = query.lower()
        all_schemes = [s for s in all_schemes if 
                       query in s['name'].lower() or 
                       query in s['description'].lower() or
                       (language == "hi" and (query in s.get('name_hi', '').lower() or 
                                             query in s.get('description_hi', '').lower()))]
    
    if category and category != "all":
        all_schemes = [s for s in all_schemes if s['category'] == category]
    
    return all_schemes

def check_eligibility(land_size: float, annual_income: float, language: str = "en") -> List[Dict]:
    """Check which schemes a farmer is eligible for"""
    all_schemes = fetch_government_schemes(language)
    eligible = []
    
    for scheme in all_schemes:
        is_eligible = True
        
        # Check land size requirement
        if 'minLandSize' in scheme and land_size < scheme['minLandSize']:
            is_eligible = False
        
        # Check income limit
        if 'maxIncome' in scheme and annual_income > scheme['maxIncome']:
            is_eligible = False
        
        if is_eligible:
            eligible.append(scheme)
    
    return eligible

