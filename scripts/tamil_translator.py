#!/usr/bin/env python3
"""
Tamil Translation Helper Module
Provides translation services for English text to Tamil
Supports multiple translation backends:
- Google Translate API (online)
- Offline Tamil transliteration dictionary
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TranslationEntry:
    """Single translation entry"""
    english: str
    tamil: str
    confidence: float = 1.0
    method: str = "manual"  # manual, api, transliteration


class TamilTranslator:
    """Translate English text to Tamil with multiple backend support"""
    
    TAMIL_DICTIONARY = {
        # Common bus stop locations
        'BROADWAY': 'பாடாவே',
        'ANNA NAGAR': 'அண்ணா நகர்',
        'KOYAMBEDU': 'கோயம்பேடு',
        'POONAMALLEE': 'பூணமல்லி',
        'SALEM': 'சேலம்',
        'MADURAI': 'மதுரை',
        'COIMBATORE': 'கோயம்பூர்',
        'TIRUPPUR': 'திருப்பூர்',
        'ERODE': 'ஈரோடு',
        'SALEM': 'சேலம்',
        'TRICHY': 'திருச்சிராப்பள்ளி',
        'VILLUPURAM': 'விள்ளுப்புரம்',
        'KANCHIPURAM': 'காஞ்சிபுரம்',
        'TINDIVANAM': 'திண்டிவனம்',
        'CHENGALPATTU': 'சேஞ்சல்பট்டு',
        'VELLORE': 'வேலூர்',
        'RANIPET': 'ராணிப்பேட்',
        'HOSUR': 'ஹோசூர்',
        'UDHAGAMANDALAM': 'உதகமண்டலம்',
        'COONOOR': 'கூனூர்',
        'METTUPALAYAM': 'மேட்டுப்பாளையம்',
        'KODAIKANAL': 'கோடைக்கானல்',
        'DINDIGUL': 'திண்டுக்கல்',
        'PALANI': 'பழனி',
        'POLLACHI': 'பொள்ளாச்சி',
        'NAGERCOIL': 'நாகர்கோவில்',
        'KANYAKUMARI': 'கன்னியाகுமारி',
        'THOOTHUKUDI': 'தூத்துக்குடி',
        'VIRUDUNAGAR': 'விருதுநகர்',
        'SIVAKASI': 'சிவகாசி',
        'THENI': 'தேனி',
        'NAMAKKAL': 'நாமக்கல்',
        'KRISHNAGIRI': 'கிருஷ்ணகிரி',
        'PERAMBALUR': 'பெரம்பலூர்',
        'CUDDALORE': 'கடலூர்',
        'PUDUCHERRY': 'புதுச்சேரி',
        'PONDICHERRY': 'பாண்டிச்சேரி',
        'KARAIKAL': 'காரைக்கால்',
        'TIRUVANNAMALAI': 'திருவண்ணாமலை',
        'RANIPET': 'ராணிப்பேட்',
        'SRIPERUMBUDUR': 'சிறிபெரும்புதூர்',
        'TAMBARAM': 'தாம்பரம்',
        'AVADI': 'அவடி',
        'THIRUVALLUR': 'திருவள்ளூர்',
        'ALANDUR': 'ஆலந்துர்',
        'ASHOK NAGAR': 'அசோக் நகர்',
        'BESANT NAGAR': 'பேசன்ट் நகர்',
        'CHINTADRIPET': 'சிந்தாத்திரிப்பேட்',
        'DENNINGTON ROAD': 'டென்னிங்டன் சாலை',
        'GEORGE TOWN': 'ஜார்ஜ் டவுன்',
        'ADYAR': 'அடியார்',
        'MADRAS': 'மெட்ராஸ்',
        'MAHABALIPURAM': 'மகாபலிபுரம்',
        'VEDANTHANGAL': 'வேதாந்தாங்கள்',
        'TIRUNELVELI': 'திருநெல்வேலி',
        'NELLORE': 'நெல்லூர்',
        'TADA': 'தாடा',
        'SULURPET': 'சுलூர்பேட்',
        'GUDUR': 'குடூர்',
        'CHITTOOR': 'சित்தூர்',
        'BARGUR': 'பர்கூர்',
        'WALAJAH': 'வளாஜா',
        'PALAMNER': 'பாலமनेर்',
        'RENIGUNTA': 'রেनिগुნटा',
        'TIRUPATI': 'திருப்பதி',
        'ALAMPUR': 'ஆலம்பூர்',
        'ATMAKUR': 'ஆத்மமூர்',
        'M.G.R KOYAMBEDU': 'மெ.தி.ம கோயம்பேடு',
        'ANNA NAGAR EAST': 'அண்ணா நகர் கிழக்கு',
        'POONAMALLEE B.S': 'பூணமல்லி பி.எஸ்',
    }
    
    def __init__(self, use_api: bool = False, api_key: Optional[str] = None):
        """
        Initialize translator
        
        Args:
            use_api: If True, use Google Translate API (requires credentials)
            api_key: Google Cloud API key (optional, can be set via environment)
        """
        self.use_api = use_api
        self.api_key = api_key or os.getenv('GOOGLE_TRANSLATE_API_KEY')
        self.translator = None
        self.cache = {}
        self.cache_file = Path('data/translation_cache.json')
        
        if use_api and self.api_key:
            self._init_google_translator()
        else:
            logger.info("Using offline Tamil dictionary for translation")
        
        self._load_cache()
    
    def _init_google_translator(self):
        """Initialize Google Translate API client"""
        try:
            from google.cloud import translate_v2
            self.translator = translate_v2.Client()
            logger.info("Initialized Google Translate API")
        except ImportError:
            logger.warning("google-cloud-translate not installed. Using offline dictionary.")
            self.use_api = False
        except Exception as e:
            logger.warning(f"Failed to initialize Google Translate: {e}. Using offline dictionary.")
            self.use_api = False
    
    def _load_cache(self):
        """Load translation cache from file"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    self.cache = json.load(f)
                logger.info(f"Loaded {len(self.cache)} translations from cache")
            except Exception as e:
                logger.warning(f"Failed to load cache: {e}")
                self.cache = {}
    
    def _save_cache(self):
        """Save translation cache to file"""
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save cache: {e}")
    
    def _translate_via_api(self, text: str) -> Optional[str]:
        """Translate using Google Translate API"""
        try:
            if not self.translator:
                return None
            
            result = self.translator.translate_text(
                text,
                source_language='en',
                target_language='ta'
            )
            
            return result.get('translatedText')
        except Exception as e:
            logger.warning(f"API translation failed for '{text}': {e}")
            return None
    
    def _translate_via_dictionary(self, text: str) -> Optional[str]:
        """Translate using offline dictionary"""
        text_upper = text.upper().strip()
        
        # Exact match
        if text_upper in self.TAMIL_DICTIONARY:
            return self.TAMIL_DICTIONARY[text_upper]
        
        # Partial match
        for english, tamil in self.TAMIL_DICTIONARY.items():
            if english.lower() in text_upper.lower():
                return tamil
        
        return None
    
    def translate(self, text: str) -> Optional[str]:
        """
        Translate English text to Tamil
        Uses cache first, then tries API or dictionary
        """
        if not text or not isinstance(text, str):
            return None
        
        text_key = text.lower().strip()
        
        # Check cache
        if text_key in self.cache:
            return self.cache[text_key]
        
        tamil_text = None
        
        # Try API if enabled
        if self.use_api and self.translator:
            tamil_text = self._translate_via_api(text)
        
        # Fallback to dictionary
        if not tamil_text:
            tamil_text = self._translate_via_dictionary(text)
        
        # Cache result
        if tamil_text:
            self.cache[text_key] = tamil_text
        
        return tamil_text
    
    def translate_location(self, location_name: str) -> Optional[str]:
        """Translate a location name to Tamil"""
        return self.translate(location_name)
    
    def save_cache(self):
        """Explicitly save cache to file"""
        self._save_cache()
    
    def get_batch_translations(self, texts: List[str]) -> Dict[str, Optional[str]]:
        """Translate multiple texts efficiently"""
        results = {}
        for text in texts:
            results[text] = self.translate(text)
        return results


def create_translation_entry(
    english: str, 
    tamil: str, 
    entity_type: str = 'location',
    entity_id: Optional[int] = None,
    field_name: str = 'name',
    method: str = 'api'
) -> Dict:
    """Create a translation entry for database insertion"""
    return {
        'entity_type': entity_type,
        'entity_id': entity_id,
        'language_code': 'ta',
        'field_name': field_name,
        'translated_value': tamil,
        'method': method,
        'created_at': datetime.now().isoformat()
    }


if __name__ == '__main__':
    # Test translations
    translator = TamilTranslator()
    
    test_locations = [
        'BROADWAY',
        'ANNA NAGAR EAST',
        'M.G.R KOYAMBEDU',
        'MADURAI',
        'SALEM'
    ]
    
    print("Testing Tamil Translations:")
    print("=" * 60)
    
    for location in test_locations:
        tamil = translator.translate_location(location)
        print(f"  {location:20} -> {tamil}")
    
    print("=" * 60)
    translator.save_cache()
