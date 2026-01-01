"""
Real-time Government Schemes Fetcher with Automatic Translation
Fetches latest schemes from government sources and provides Hindi translation
"""

import requests
from datetime import datetime
from typing import List, Dict, Optional
import json
from deep_translator import GoogleTranslator
import hashlib
import time

class RealTimeSchemesFetcher:
    """
    Fetches government schemes from official sources and provides
    automatic English to Hindi translation
    """
    
    def __init__(self):
        self.myscheme_api = "https://www.myscheme.gov.in/api/schemes"
        self.cache_file = "schemes_cache.json"
        self.cache_duration = 3600  # 1 hour cache
        self.translator = GoogleTranslator(source='en', target='hi')
        
    def fetch_from_myscheme_portal(self) -> List[Dict]:
        """
        Fetch schemes from MyScheme.gov.in portal
        This is an official Government of India portal
        """
        try:
            # Note: This is a conceptual implementation
            # The actual API endpoint might require authentication
            headers = {
                'User-Agent': 'AgriChain-FarmerApp/1.0',
                'Accept': 'application/json'
            }
            
            # Example API call (you'll need to check actual API documentation)
            response = requests.get(
                "https://www.myscheme.gov.in/api/schemes",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_myscheme_data(data)
            else:
                print(f"MyScheme API returned status: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching from MyScheme portal: {e}")
            return []
    
    def parse_myscheme_data(self, data: Dict) -> List[Dict]:
        """Parse MyScheme portal data to our format"""
        schemes = []
        
        # Filter for agriculture-related schemes
        agriculture_keywords = ['farmer', 'agriculture', 'crop', 'kisan', 'fasal', 'krishi']
        
        for scheme in data.get('schemes', []):
            # Check if scheme is agriculture-related
            scheme_text = (scheme.get('name', '') + scheme.get('description', '')).lower()
            if any(keyword in scheme_text for keyword in agriculture_keywords):
                schemes.append({
                    'id': scheme.get('id'),
                    'name': scheme.get('name'),
                    'category': self.categorize_scheme(scheme),
                    'description': scheme.get('description'),
                    'eligibility': scheme.get('eligibility_criteria', []),
                    'benefits': scheme.get('benefits', ''),
                    'deadline': scheme.get('application_deadline', 'Ongoing'),
                    'status': 'active',
                    'link': scheme.get('official_url', ''),
                    'organization': scheme.get('ministry', 'Government of India'),
                    'last_updated': datetime.now().isoformat()
                })
        
        return schemes
    
    def categorize_scheme(self, scheme: Dict) -> str:
        """Automatically categorize scheme based on content"""
        name_desc = (scheme.get('name', '') + scheme.get('description', '')).lower()
        
        if 'insurance' in name_desc or 'bima' in name_desc:
            return 'Insurance'
        elif 'credit' in name_desc or 'loan' in name_desc or 'kcc' in name_desc:
            return 'Credit/Loans'
        elif 'organic' in name_desc or 'jaivik' in name_desc:
            return 'Organic Farming'
        elif 'water' in name_desc or 'irrigation' in name_desc:
            return 'Water Conservation'
        elif 'market' in name_desc or 'sell' in name_desc:
            return 'Marketing'
        elif 'solar' in name_desc or 'energy' in name_desc:
            return 'Energy/Infrastructure'
        elif 'soil' in name_desc or 'test' in name_desc:
            return 'Agricultural Services'
        else:
            return 'Financial Support'
    
    def translate_to_hindi(self, text: str) -> str:
        """
        Translate English text to Hindi using Google Translate API
        Implements caching to avoid repeated translations
        """
        try:
            # Create cache key
            cache_key = hashlib.md5(text.encode()).hexdigest()
            
            # Check cache first (implement your own caching mechanism)
            # For now, directly translate
            
            # Split long text into chunks (Google Translate has limits)
            max_length = 5000
            if len(text) <= max_length:
                translated = self.translator.translate(text)
                return translated
            else:
                # Split and translate in chunks
                chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
                translated_chunks = [self.translator.translate(chunk) for chunk in chunks]
                return ' '.join(translated_chunks)
                
        except Exception as e:
            print(f"Translation error: {e}")
            return text  # Return original if translation fails
    
    def translate_scheme(self, scheme: Dict) -> Dict:
        """Translate all text fields of a scheme to Hindi"""
        try:
            translated_scheme = {
                'name': self.translate_to_hindi(scheme['name']),
                'description': self.translate_to_hindi(scheme['description']),
                'benefits': self.translate_to_hindi(scheme['benefits']),
                'eligibility': [self.translate_to_hindi(item) for item in scheme['eligibility']],
                'category': self.translate_to_hindi(scheme['category'])
            }
            
            # Add small delay to avoid rate limiting
            time.sleep(0.5)
            
            return translated_scheme
        except Exception as e:
            print(f"Error translating scheme: {e}")
            return None
    
    def fetch_and_cache_schemes(self) -> List[Dict]:
        """
        Fetch schemes from various sources, cache them, and return
        """
        # Try to read from cache first
        cached_schemes = self.read_from_cache()
        if cached_schemes:
            return cached_schemes
        
        all_schemes = []
        
        # Source 1: MyScheme Portal
        myscheme_data = self.fetch_from_myscheme_portal()
        all_schemes.extend(myscheme_data)
        
        # Source 2: Could add more sources here
        # dbt_data = self.fetch_from_dbt_portal()
        # all_schemes.extend(dbt_data)
        
        # Save to cache
        self.save_to_cache(all_schemes)
        
        return all_schemes
    
    def read_from_cache(self) -> Optional[List[Dict]]:
        """Read schemes from cache if not expired"""
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Check if cache is still valid
            cache_time = datetime.fromisoformat(cache_data['timestamp'])
            if (datetime.now() - cache_time).seconds < self.cache_duration:
                return cache_data['schemes']
            
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            pass
        
        return None
    
    def save_to_cache(self, schemes: List[Dict]):
        """Save schemes to cache file"""
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'schemes': schemes
            }
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving to cache: {e}")


# Example usage
if __name__ == "__main__":
    fetcher = RealTimeSchemesFetcher()
    
    # Fetch latest schemes
    print("Fetching latest government schemes...")
    schemes = fetcher.fetch_and_cache_schemes()
    
    print(f"Found {len(schemes)} schemes")
    
    # Translate first scheme as example
    if schemes:
        print("\nTranslating first scheme to Hindi...")
        hindi_translation = fetcher.translate_scheme(schemes[0])
        print(json.dumps(hindi_translation, ensure_ascii=False, indent=2))

