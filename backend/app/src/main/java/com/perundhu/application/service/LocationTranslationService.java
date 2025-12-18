package com.perundhu.application.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.TranslationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling location translations between Tamil and English.
 * Provides lookup and storage capabilities for bilingual location names.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LocationTranslationService {

    private final TranslationRepository translationRepository;
    private final LocationRepository locationRepository;

    // Common Tamil Nadu location mappings (Tamil -> English)
    private static final Map<String, String> TAMIL_TO_ENGLISH_LOCATIONS = new HashMap<>();
    private static final Map<String, String> ENGLISH_TO_TAMIL_LOCATIONS = new HashMap<>();

    static {
        // Major cities
        addMapping("சென்னை", "Chennai");
        addMapping("கோயம்புத்தூர்", "Coimbatore");
        addMapping("மதுரை", "Madurai");
        addMapping("திருச்சி", "Trichy");
        addMapping("திருச்சிராப்பள்ளி", "Tiruchirappalli");
        addMapping("சேலம்", "Salem");
        addMapping("திருநெல்வேலி", "Tirunelveli");
        addMapping("கன்னியாகுமரி", "Kanyakumari");
        addMapping("வேலூர்", "Vellore");
        addMapping("தஞ்சாவூர்", "Thanjavur");
        addMapping("கும்பகோணம்", "Kumbakonam");
        addMapping("ஈரோடு", "Erode");
        addMapping("திருப்பூர்", "Tirupur");
        addMapping("நாகர்கோவில்", "Nagercoil");
        addMapping("தூத்துக்குடி", "Thoothukudi");
        addMapping("துத்துக்குடி", "Tuticorin");
        addMapping("காஞ்சிபுரம்", "Kanchipuram");
        addMapping("கடலூர்", "Cuddalore");
        addMapping("நாகப்பட்டினம்", "Nagapattinam");
        addMapping("புதுக்கோட்டை", "Pudukkottai");
        addMapping("ராமநாதபுரம்", "Ramanathapuram");
        addMapping("சிவகங்கை", "Sivaganga");
        addMapping("விருதுநகர்", "Virudhunagar");
        addMapping("தேனி", "Theni");
        addMapping("திண்டுக்கல்", "Dindigul");
        addMapping("கரூர்", "Karur");
        addMapping("நாமக்கல்", "Namakkal");
        addMapping("பெரம்பலூர்", "Perambalur");
        addMapping("அரியலூர்", "Ariyalur");
        addMapping("கிருஷ்ணகிரி", "Krishnagiri");
        addMapping("தர்மபுரி", "Dharmapuri");
        addMapping("திருவண்ணாமலை", "Tiruvannamalai");
        addMapping("விழுப்புரம்", "Villupuram");
        addMapping("கள்ளக்குறிச்சி", "Kallakurichi");
        addMapping("நீலகிரி", "Nilgiris");
        addMapping("ஊட்டி", "Ooty");
        addMapping("கொடைக்கானல்", "Kodaikanal");
        addMapping("திருவாரூர்", "Tiruvarur");
        addMapping("மயிலாடுதுறை", "Mayiladuthurai");
        addMapping("தென்காசி", "Tenkasi");
        addMapping("திருப்பத்தூர்", "Tirupattur");
        addMapping("ராணிப்பேட்டை", "Ranipet");
        addMapping("செங்கல்பட்டு", "Chengalpattu");

        // Virudhunagar district towns
        addMapping("சிவகாசி", "Sivakasi");
        addMapping("சாத்தூர்", "Sattur");
        addMapping("ஸ்ரீவில்லிபுத்தூர்", "Srivilliputhur");
        addMapping("ஸ்ரீவைகுண்டம்", "Srivaikuntam");
        addMapping("அருப்புக்கோட்டை", "Aruppukkottai");
        addMapping("ராஜபாளையம்", "Rajapalayam");
        addMapping("திருச்சுழி", "Tiruchuli");
        addMapping("வத்திராயிருப்பு", "Watrap");
        addMapping("காரியாபட்டி", "Kariapatti");

        // Madurai district towns
        addMapping("திருமங்கலம்", "Thirumangalam");
        addMapping("மேலூர்", "Melur");
        addMapping("உசிலம்பட்டி", "Usilampatti");
        addMapping("பெரியகுளம்", "Periyakulam");
        addMapping("வாடிப்பட்டி", "Vadipatti");

        // Tirunelveli district towns
        addMapping("அம்பாசமுத்திரம்", "Ambasamudram");
        addMapping("செங்கோட்டை", "Senkottai");
        addMapping("கூத்தனூர்", "Koothannur");
        addMapping("நெல்லை", "Nellai");
        addMapping("பாளையங்கோட்டை", "Palayamkottai");

        // Other important towns
        addMapping("ஆத்தூர்", "Attur");
        addMapping("மேட்டூர்", "Mettur");
        addMapping("பவானி", "Bhavani");
        addMapping("கோபிசெட்டிப்பாளையம்", "Gobichettipalayam");
        addMapping("திருப்பூர்", "Tiruppur");
        addMapping("அவினாசி", "Avinashi");
        addMapping("உடுமலைப்பேட்டை", "Udumalaipettai");
        addMapping("பொள்ளாச்சி", "Pollachi");
        addMapping("பழனி", "Palani");
        addMapping("ஒட்டன்சத்திரம்", "Ottanchatram");
        addMapping("நத்தம்", "Natham");
        addMapping("வேடசந்தூர்", "Vedasandur");
        addMapping("கொடைக்கானல்", "Kodaikanal");
        addMapping("பேரணாமல்லூர்", "Peranamallur");
        addMapping("ஆரணி", "Arani");
        addMapping("செய்யார்", "Cheyyar");
        addMapping("வந்தவாசி", "Vandavasi");
        addMapping("பொன்னேரி", "Ponneri");
        addMapping("திருவள்ளூர்", "Tiruvallur");
        addMapping("ஆம்பூர்", "Ambur");
        addMapping("வாணியம்பாடி", "Vaniyambadi");
        addMapping("ஜோலார்பேட்டை", "Jolarpettai");
        addMapping("ஓசூர்", "Hosur");
        addMapping("தேன்கனிக்கோட்டை", "Denkanikottai");
        addMapping("அன்னூர்", "Annur");
        addMapping("மேட்டுப்பாளையம்", "Mettupalayam");
        addMapping("ஊட்டி", "Ooty");
        addMapping("குன்னூர்", "Coonoor");
        addMapping("கோத்தகிரி", "Kotagiri");
        addMapping("சிதம்பரம்", "Chidambaram");
        addMapping("சீர்காழி", "Sirkazhi");
        addMapping("திருவாரூர்", "Tiruvarur");
        addMapping("நன்னிலம்", "Nannilam");
        addMapping("திருத்துறைப்பூண்டி", "Thiruthuraipoondi");
        addMapping("காரைக்கால்", "Karaikal");
        addMapping("வேதாரண்யம்", "Vedaranyam");
        addMapping("பட்டுக்கோட்டை", "Pattukottai");
        addMapping("அறந்தாங்கி", "Aranthangi");
        addMapping("கீரனூர்", "Keeranur");
        addMapping("இளையான்குடி", "Ilayangudi");
        addMapping("கராய்க்குடி", "Karaikudi");
        addMapping("தேவகோட்டை", "Devakottai");
        addMapping("பரமக்குடி", "Paramakudi");
        addMapping("முதுகுளத்தூர்", "Mudukulathur");
        addMapping("மண்டபம்", "Mandapam");
        addMapping("ராமேஸ்வரம்", "Rameswaram");
        addMapping("தொண்டி", "Thondi");

        // Bus station names that might be entered
        addMapping("பேருந்து நிலையம்", "Bus Stand");
        addMapping("மத்திய பேருந்து நிலையம்", "Central Bus Stand");
        addMapping("பேருந்து முனையம்", "Bus Terminus");
    }

    private static void addMapping(String tamil, String english) {
        TAMIL_TO_ENGLISH_LOCATIONS.put(tamil.toLowerCase(), english);
        ENGLISH_TO_TAMIL_LOCATIONS.put(english.toLowerCase(), tamil);
    }

    /**
     * Detects if the text contains Tamil characters
     */
    public boolean isTamilText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        // Tamil Unicode range: \u0B80-\u0BFF
        return text.matches(".*[\\u0B80-\\u0BFF].*");
    }

    /**
     * Detects the language of the text
     */
    public String detectLanguage(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "en";
        }
        return isTamilText(text) ? "ta" : "en";
    }

    /**
     * Translates a Tamil location name to English
     */
    public Optional<String> translateToEnglish(String tamilName) {
        if (tamilName == null || tamilName.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalizedTamil = tamilName.trim().toLowerCase();

        // First try static mappings
        if (TAMIL_TO_ENGLISH_LOCATIONS.containsKey(normalizedTamil)) {
            String english = TAMIL_TO_ENGLISH_LOCATIONS.get(normalizedTamil);
            log.debug("Found static mapping: {} -> {}", tamilName, english);
            return Optional.of(english);
        }

        // Try database translations (search for Tamil text in translations table)
        List<Translation> translations = translationRepository.findByLanguage("ta");
        for (Translation translation : translations) {
            if (translation.getTranslatedValue() != null &&
                    translation.getTranslatedValue().equalsIgnoreCase(tamilName.trim())) {
                // Found a Tamil translation, get the English name from location table
                if ("location".equalsIgnoreCase(translation.getEntityType()) &&
                        "name".equals(translation.getFieldName())) {
                    Optional<Location> location = locationRepository.findById(translation.getEntityId());
                    if (location.isPresent()) {
                        log.debug("Found database translation: {} -> {}", tamilName, location.get().getName());
                        return Optional.of(location.get().getName());
                    }
                }
            }
        }

        log.debug("No translation found for Tamil name: {}", tamilName);
        return Optional.empty();
    }

    /**
     * Translates an English location name to Tamil
     */
    public Optional<String> translateToTamil(String englishName) {
        if (englishName == null || englishName.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalizedEnglish = englishName.trim().toLowerCase();

        // First try static mappings
        if (ENGLISH_TO_TAMIL_LOCATIONS.containsKey(normalizedEnglish)) {
            String tamil = ENGLISH_TO_TAMIL_LOCATIONS.get(normalizedEnglish);
            log.debug("Found static mapping: {} -> {}", englishName, tamil);
            return Optional.of(tamil);
        }

        // Try database translations
        List<Location> locations = locationRepository.findByName(englishName);
        for (Location location : locations) {
            Optional<Translation> translation = translationRepository.findTranslation(
                    "location", location.getId().getValue(), "ta", "name");
            if (translation.isPresent()) {
                log.debug("Found database translation: {} -> {}", englishName, translation.get().getTranslatedValue());
                return Optional.of(translation.get().getTranslatedValue());
            }
        }

        log.debug("No Tamil translation found for: {}", englishName);
        return Optional.empty();
    }

    /**
     * Gets or creates the English name for a location.
     * If the input is Tamil, translates it to English.
     * If the input is already English, returns it as-is (normalized).
     */
    public String getEnglishName(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return locationName;
        }

        String trimmed = locationName.trim();

        if (isTamilText(trimmed)) {
            // Try to translate Tamil to English
            Optional<String> english = translateToEnglish(trimmed);
            if (english.isPresent()) {
                return english.get();
            }
            // No translation found - return as-is (will be stored as new location)
            log.warn("No English translation found for Tamil location: {}. Using original.", trimmed);
            return normalizePlaceName(trimmed);
        }

        // Already English - normalize and return
        return normalizePlaceName(trimmed);
    }

    /**
     * Gets the Tamil name for a location.
     * If the input is already Tamil, returns it as-is.
     * If the input is English, looks up or provides the Tamil translation.
     */
    public Optional<String> getTamilName(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = locationName.trim();

        if (isTamilText(trimmed)) {
            // Already Tamil
            return Optional.of(trimmed);
        }

        // Try to translate English to Tamil
        return translateToTamil(trimmed);
    }

    /**
     * Finds a location by name in any language (English or Tamil)
     */
    public Optional<Location> findLocationByAnyLanguage(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = name.trim();

        // 1. Try direct match in locations table (English names)
        Optional<Location> directMatch = locationRepository.findByExactName(trimmed);
        if (directMatch.isPresent()) {
            log.debug("Found location by direct match: {}", trimmed);
            return directMatch;
        }

        // 2. Try normalized name match
        String normalized = normalizePlaceName(trimmed);
        directMatch = locationRepository.findByExactName(normalized);
        if (directMatch.isPresent()) {
            log.debug("Found location by normalized match: {}", normalized);
            return directMatch;
        }

        // 3. If Tamil text, try to find by translating to English
        if (isTamilText(trimmed)) {
            Optional<String> english = translateToEnglish(trimmed);
            if (english.isPresent()) {
                directMatch = locationRepository.findByExactName(english.get());
                if (directMatch.isPresent()) {
                    log.debug("Found location by Tamil-to-English translation: {} -> {}",
                            trimmed, english.get());
                    return directMatch;
                }
            }

            // 4. Search in translations table for Tamil name
            List<Translation> translations = translationRepository.findByLanguage("ta");
            for (Translation translation : translations) {
                if ("location".equalsIgnoreCase(translation.getEntityType()) &&
                        "name".equals(translation.getFieldName()) &&
                        translation.getTranslatedValue() != null &&
                        translation.getTranslatedValue().equalsIgnoreCase(trimmed)) {

                    Optional<Location> location = locationRepository.findById(translation.getEntityId());
                    if (location.isPresent()) {
                        log.debug("Found location by translation table lookup: {} -> {}",
                                trimmed, location.get().getName());
                        return location;
                    }
                }
            }
        }

        // 5. Try partial match
        List<Location> partialMatches = locationRepository.findByName(trimmed);
        if (!partialMatches.isEmpty()) {
            log.debug("Found location by partial match: {}", trimmed);
            // Java 21 Sequenced Collections - getFirst()
            return Optional.of(partialMatches.getFirst());
        }

        log.debug("No location found for name: {}", trimmed);
        return Optional.empty();
    }

    /**
     * Saves a translation for a location
     */
    public void saveLocationTranslation(Location location, String tamilName) {
        if (location == null || location.getId() == null || tamilName == null || tamilName.trim().isEmpty()) {
            log.warn("Cannot save translation: invalid location or Tamil name");
            return;
        }

        // Check if translation already exists
        Optional<Translation> existing = translationRepository.findTranslation(
                "location", location.getId().getValue(), "ta", "name");

        if (existing.isPresent()) {
            // Update existing translation
            Translation translation = existing.get();
            translation.updateValue(tamilName.trim());
            translationRepository.save(translation);
            log.info("Updated Tamil translation for location {}: {}", location.getName(), tamilName);
        } else {
            // Create new translation
            Translation translation = new Translation(
                    "location",
                    location.getId().getValue(),
                    "ta",
                    "name",
                    tamilName.trim());
            translationRepository.save(translation);
            log.info("Created Tamil translation for location {}: {}", location.getName(), tamilName);
        }
    }

    /**
     * Creates a location with both English and Tamil names
     */
    public Location createLocationWithTranslation(String name, Double latitude, Double longitude,
            String tamilName) {
        // Determine English name
        String englishName = getEnglishName(name);

        // Create location with English name
        Location newLocation = Location.withCoordinates(null, englishName, latitude, longitude);
        Location saved = locationRepository.save(newLocation);

        // Determine Tamil name to save
        String tamilToSave = tamilName;
        if (tamilToSave == null || tamilToSave.trim().isEmpty()) {
            // Try to get Tamil translation
            if (isTamilText(name)) {
                tamilToSave = name; // Original input was Tamil
            } else {
                Optional<String> tamil = translateToTamil(englishName);
                tamilToSave = tamil.orElse(null);
            }
        }

        // Save Tamil translation if available
        if (tamilToSave != null && !tamilToSave.trim().isEmpty()) {
            saveLocationTranslation(saved, tamilToSave);
        }

        log.info("Created location: {} (Tamil: {})", englishName, tamilToSave);
        return saved;
    }

    /**
     * Normalize place names to Title Case for consistency.
     */
    private String normalizePlaceName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        String trimmed = name.trim();

        // If it's Tamil text, don't apply English normalization
        if (isTamilText(trimmed)) {
            return trimmed;
        }

        // Convert to Title Case for English
        String[] words = trimmed.toLowerCase().split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                if (result.length() > 0) {
                    result.append(" ");
                }
                result.append(Character.toUpperCase(word.charAt(0)));
                if (word.length() > 1) {
                    result.append(word.substring(1));
                }
            }
        }
        return result.toString();
    }

    /**
     * Get the static Tamil to English mappings (for admin/debugging)
     */
    public Map<String, String> getTamilToEnglishMappings() {
        return new HashMap<>(TAMIL_TO_ENGLISH_LOCATIONS);
    }

    /**
     * Get the static English to Tamil mappings (for admin/debugging)
     */
    public Map<String, String> getEnglishToTamilMappings() {
        return new HashMap<>(ENGLISH_TO_TAMIL_LOCATIONS);
    }

    /**
     * Add a new mapping (runtime addition, not persisted to static map)
     */
    public void addStaticMapping(String tamil, String english) {
        TAMIL_TO_ENGLISH_LOCATIONS.put(tamil.toLowerCase(), english);
        ENGLISH_TO_TAMIL_LOCATIONS.put(english.toLowerCase(), tamil);
        log.info("Added static mapping: {} <-> {}", tamil, english);
    }
}
