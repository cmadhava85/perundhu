package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.TranslationRepository;

/**
 * Unit tests for LocationTranslationService.
 * 
 * Tests cover:
 * - Tamil text detection
 * - Language detection
 * - Tamil to English translation
 * - English to Tamil translation
 * - Location lookup by any language
 * - Translation storage
 * - Static mapping management
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Location Translation Service Tests")
class LocationTranslationServiceTest {

  @Mock
  private TranslationRepository translationRepository;

  @Mock
  private LocationRepository locationRepository;

  private LocationTranslationService locationTranslationService;

  @BeforeEach
  void setUp() {
    locationTranslationService = new LocationTranslationService(translationRepository, locationRepository);
  }

  @Nested
  @DisplayName("Tamil Text Detection Tests")
  class TamilTextDetectionTests {

    @Test
    @DisplayName("Should detect Tamil text correctly")
    void shouldDetectTamilText() {
      // Tamil text
      assertThat(locationTranslationService.isTamilText("சென்னை")).isTrue();
      assertThat(locationTranslationService.isTamilText("மதுரை")).isTrue();
      assertThat(locationTranslationService.isTamilText("கோயம்புத்தூர்")).isTrue();
      assertThat(locationTranslationService.isTamilText("திருச்சி")).isTrue();
      assertThat(locationTranslationService.isTamilText("சிவகாசி")).isTrue();
    }

    @Test
    @DisplayName("Should not detect English text as Tamil")
    void shouldNotDetectEnglishAsTamil() {
      assertThat(locationTranslationService.isTamilText("Chennai")).isFalse();
      assertThat(locationTranslationService.isTamilText("Madurai")).isFalse();
      assertThat(locationTranslationService.isTamilText("Coimbatore")).isFalse();
      assertThat(locationTranslationService.isTamilText("Bus Station")).isFalse();
    }

    @Test
    @DisplayName("Should detect mixed Tamil-English text")
    void shouldDetectMixedText() {
      assertThat(locationTranslationService.isTamilText("சென்னை City")).isTrue();
      assertThat(locationTranslationService.isTamilText("மதுரை Bus Stand")).isTrue();
    }

    @Test
    @DisplayName("Should handle null and empty text")
    void shouldHandleNullEmpty() {
      assertThat(locationTranslationService.isTamilText(null)).isFalse();
      assertThat(locationTranslationService.isTamilText("")).isFalse();
      assertThat(locationTranslationService.isTamilText("   ")).isFalse();
    }
  }

  @Nested
  @DisplayName("Language Detection Tests")
  class LanguageDetectionTests {

    @Test
    @DisplayName("Should detect Tamil language")
    void shouldDetectTamilLanguage() {
      assertThat(locationTranslationService.detectLanguage("சென்னை")).isEqualTo("ta");
      assertThat(locationTranslationService.detectLanguage("மதுரை")).isEqualTo("ta");
    }

    @Test
    @DisplayName("Should detect English language")
    void shouldDetectEnglishLanguage() {
      assertThat(locationTranslationService.detectLanguage("Chennai")).isEqualTo("en");
      assertThat(locationTranslationService.detectLanguage("Madurai")).isEqualTo("en");
    }

    @Test
    @DisplayName("Should default to English for null/empty")
    void shouldDefaultToEnglish() {
      assertThat(locationTranslationService.detectLanguage(null)).isEqualTo("en");
      assertThat(locationTranslationService.detectLanguage("")).isEqualTo("en");
      assertThat(locationTranslationService.detectLanguage("   ")).isEqualTo("en");
    }
  }

  @Nested
  @DisplayName("Tamil to English Translation Tests")
  class TamilToEnglishTests {

    @Test
    @DisplayName("Should translate major cities from Tamil to English")
    void shouldTranslateMajorCities() {
      assertThat(locationTranslationService.translateToEnglish("சென்னை")).hasValue("Chennai");
      assertThat(locationTranslationService.translateToEnglish("மதுரை")).hasValue("Madurai");
      assertThat(locationTranslationService.translateToEnglish("கோயம்புத்தூர்")).hasValue("Coimbatore");
      assertThat(locationTranslationService.translateToEnglish("திருச்சி")).hasValue("Trichy");
      assertThat(locationTranslationService.translateToEnglish("சேலம்")).hasValue("Salem");
      assertThat(locationTranslationService.translateToEnglish("திருநெல்வேலி")).hasValue("Tirunelveli");
    }

    @Test
    @DisplayName("Should translate district towns from Tamil to English")
    void shouldTranslateDistrictTowns() {
      assertThat(locationTranslationService.translateToEnglish("சிவகாசி")).hasValue("Sivakasi");
      assertThat(locationTranslationService.translateToEnglish("விருதுநகர்")).hasValue("Virudhunagar");
      assertThat(locationTranslationService.translateToEnglish("அருப்புக்கோட்டை")).hasValue("Aruppukkottai");
      assertThat(locationTranslationService.translateToEnglish("தேனி")).hasValue("Theni");
      assertThat(locationTranslationService.translateToEnglish("திண்டுக்கல்")).hasValue("Dindigul");
      assertThat(locationTranslationService.translateToEnglish("கரூர்")).hasValue("Karur");
    }

    @Test
    @DisplayName("Should translate additional Tamil Nadu cities")
    void shouldTranslateAdditionalTamilNaduCities() {
      // Test additional Tamil Nadu cities (no other state capitals in mapping)
      assertThat(locationTranslationService.translateToEnglish("ஊட்டி")).hasValue("Ooty");
      assertThat(locationTranslationService.translateToEnglish("கொடைக்கானல்")).hasValue("Kodaikanal");
      assertThat(locationTranslationService.translateToEnglish("ராமேஸ்வரம்")).hasValue("Rameswaram");
    }

    @Test
    @DisplayName("Should return empty for unknown Tamil text")
    void shouldReturnEmptyForUnknown() {
      when(translationRepository.findByLanguage("ta")).thenReturn(new ArrayList<>());

      assertThat(locationTranslationService.translateToEnglish("அறியாத")).isEmpty();
    }

    @Test
    @DisplayName("Should return empty for null/empty input")
    void shouldReturnEmptyForNullEmpty() {
      assertThat(locationTranslationService.translateToEnglish(null)).isEmpty();
      assertThat(locationTranslationService.translateToEnglish("")).isEmpty();
      assertThat(locationTranslationService.translateToEnglish("   ")).isEmpty();
    }

    @Test
    @DisplayName("Should be case insensitive for Tamil text")
    void shouldBeCaseInsensitive() {
      // Tamil doesn't really have case, but test normalization
      assertThat(locationTranslationService.translateToEnglish("சென்னை")).hasValue("Chennai");
    }
  }

  @Nested
  @DisplayName("English to Tamil Translation Tests")
  class EnglishToTamilTests {

    @Test
    @DisplayName("Should translate major cities from English to Tamil")
    void shouldTranslateMajorCities() {
      assertThat(locationTranslationService.translateToTamil("Chennai")).hasValue("சென்னை");
      assertThat(locationTranslationService.translateToTamil("Madurai")).hasValue("மதுரை");
      assertThat(locationTranslationService.translateToTamil("Salem")).hasValue("சேலம்");
    }

    @Test
    @DisplayName("Should translate district towns from English to Tamil")
    void shouldTranslateDistrictTowns() {
      assertThat(locationTranslationService.translateToTamil("Sivakasi")).hasValue("சிவகாசி");
      assertThat(locationTranslationService.translateToTamil("Virudhunagar")).hasValue("விருதுநகர்");
      assertThat(locationTranslationService.translateToTamil("Aruppukkottai")).hasValue("அருப்புக்கோட்டை");
    }

    @Test
    @DisplayName("Should be case insensitive for English text")
    void shouldBeCaseInsensitive() {
      assertThat(locationTranslationService.translateToTamil("chennai")).hasValue("சென்னை");
      assertThat(locationTranslationService.translateToTamil("CHENNAI")).hasValue("சென்னை");
      assertThat(locationTranslationService.translateToTamil("Chennai")).hasValue("சென்னை");
      assertThat(locationTranslationService.translateToTamil("ChEnNaI")).hasValue("சென்னை");
    }

    @Test
    @DisplayName("Should return empty for unknown English text")
    void shouldReturnEmptyForUnknown() {
      when(locationRepository.findByName("UnknownCity")).thenReturn(new ArrayList<>());

      assertThat(locationTranslationService.translateToTamil("UnknownCity")).isEmpty();
    }

    @Test
    @DisplayName("Should return empty for null/empty input")
    void shouldReturnEmptyForNullEmpty() {
      assertThat(locationTranslationService.translateToTamil(null)).isEmpty();
      assertThat(locationTranslationService.translateToTamil("")).isEmpty();
    }
  }

  @Nested
  @DisplayName("Get English Name Tests")
  class GetEnglishNameTests {

    @Test
    @DisplayName("Should return English translation for Tamil input")
    void shouldReturnEnglishForTamil() {
      String result = locationTranslationService.getEnglishName("சென்னை");
      assertThat(result).isEqualTo("Chennai");
    }

    @Test
    @DisplayName("Should normalize English input")
    void shouldNormalizeEnglishInput() {
      // Should title case English input
      String result = locationTranslationService.getEnglishName("chennai");
      assertThat(result).isEqualTo("Chennai");
    }

    @Test
    @DisplayName("Should handle null/empty input")
    void shouldHandleNullEmpty() {
      assertThat(locationTranslationService.getEnglishName(null)).isNull();
      assertThat(locationTranslationService.getEnglishName("")).isEmpty();
    }
  }

  @Nested
  @DisplayName("Get Tamil Name Tests")
  class GetTamilNameTests {

    @Test
    @DisplayName("Should return Tamil translation for English input")
    void shouldReturnTamilForEnglish() {
      Optional<String> result = locationTranslationService.getTamilName("Chennai");
      assertThat(result).hasValue("சென்னை");
    }

    @Test
    @DisplayName("Should return Tamil input as-is")
    void shouldReturnTamilAsIs() {
      Optional<String> result = locationTranslationService.getTamilName("சென்னை");
      assertThat(result).hasValue("சென்னை");
    }

    @Test
    @DisplayName("Should return empty for null/empty input")
    void shouldReturnEmptyForNullEmpty() {
      assertThat(locationTranslationService.getTamilName(null)).isEmpty();
      assertThat(locationTranslationService.getTamilName("")).isEmpty();
    }
  }

  @Nested
  @DisplayName("Static Mapping Management Tests")
  class StaticMappingTests {

    @Test
    @DisplayName("Should return Tamil to English mappings")
    void shouldReturnTamilToEnglishMappings() {
      Map<String, String> mappings = locationTranslationService.getTamilToEnglishMappings();

      assertThat(mappings).isNotEmpty();
      assertThat(mappings).containsEntry("சென்னை", "Chennai");
      assertThat(mappings).containsEntry("மதுரை", "Madurai");
    }

    @Test
    @DisplayName("Should return English to Tamil mappings")
    void shouldReturnEnglishToTamilMappings() {
      Map<String, String> mappings = locationTranslationService.getEnglishToTamilMappings();

      assertThat(mappings).isNotEmpty();
      assertThat(mappings).containsEntry("chennai", "சென்னை");
      assertThat(mappings).containsEntry("madurai", "மதுரை");
    }

    @Test
    @DisplayName("Should add new static mapping")
    void shouldAddNewStaticMapping() {
      // Add a new mapping
      locationTranslationService.addStaticMapping("புதிய", "NewCity");

      // Verify it can be translated
      assertThat(locationTranslationService.translateToEnglish("புதிய")).hasValue("NewCity");
      assertThat(locationTranslationService.translateToTamil("newcity")).hasValue("புதிய");
    }
  }

  @Nested
  @DisplayName("Find Location By Any Language Tests")
  class FindLocationByAnyLanguageTests {

    @Test
    @DisplayName("Should find location by direct English match")
    void shouldFindByDirectEnglishMatch() {
      Location mockLocation = createMockLocation(1L, "Chennai");
      when(locationRepository.findByExactName("Chennai")).thenReturn(Optional.of(mockLocation));

      Optional<Location> result = locationTranslationService.findLocationByAnyLanguage("Chennai");

      assertThat(result).isPresent();
      assertThat(result.get().getName()).isEqualTo("Chennai");
    }

    @Test
    @DisplayName("Should find location by normalized name")
    void shouldFindByNormalizedName() {
      Location mockLocation = createMockLocation(1L, "Chennai");
      when(locationRepository.findByExactName("chennai")).thenReturn(Optional.empty());
      when(locationRepository.findByExactName("Chennai")).thenReturn(Optional.of(mockLocation));

      Optional<Location> result = locationTranslationService.findLocationByAnyLanguage("chennai");

      assertThat(result).isPresent();
    }

    @Test
    @DisplayName("Should find location by Tamil name translation")
    void shouldFindByTamilName() {
      Location mockLocation = createMockLocation(1L, "Chennai");
      when(locationRepository.findByExactName("சென்னை")).thenReturn(Optional.empty());
      when(locationRepository.findByExactName("Chennai")).thenReturn(Optional.of(mockLocation));

      Optional<Location> result = locationTranslationService.findLocationByAnyLanguage("சென்னை");

      assertThat(result).isPresent();
      assertThat(result.get().getName()).isEqualTo("Chennai");
    }

    @Test
    @DisplayName("Should return empty for unknown location")
    void shouldReturnEmptyForUnknown() {
      // Use a truly unknown location that won't match static mappings or any search
      // The service will try exact match, then translation lookup
      when(locationRepository.findByExactName(any())).thenReturn(Optional.empty());
      when(locationRepository.findByName(any())).thenReturn(new ArrayList<>());

      Optional<Location> result = locationTranslationService.findLocationByAnyLanguage("UnknownPlace");

      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should return empty for null/empty input")
    void shouldReturnEmptyForNullEmpty() {
      assertThat(locationTranslationService.findLocationByAnyLanguage(null)).isEmpty();
      assertThat(locationTranslationService.findLocationByAnyLanguage("")).isEmpty();
      assertThat(locationTranslationService.findLocationByAnyLanguage("   ")).isEmpty();
    }
  }

  @Nested
  @DisplayName("Save Location Translation Tests")
  class SaveLocationTranslationTests {

    @Test
    @DisplayName("Should create new translation when not exists")
    void shouldCreateNewTranslation() {
      Location mockLocation = createMockLocation(1L, "Chennai");
      when(translationRepository.findTranslation("location", 1L, "ta", "name"))
          .thenReturn(Optional.empty());

      locationTranslationService.saveLocationTranslation(mockLocation, "சென்னை");

      verify(translationRepository).save(any(Translation.class));
    }

    @Test
    @DisplayName("Should update existing translation")
    void shouldUpdateExistingTranslation() {
      Location mockLocation = createMockLocation(1L, "Chennai");
      Translation existingTranslation = new Translation("location", 1L, "ta", "name", "சென்னை Old");
      when(translationRepository.findTranslation("location", 1L, "ta", "name"))
          .thenReturn(Optional.of(existingTranslation));

      locationTranslationService.saveLocationTranslation(mockLocation, "சென்னை");

      verify(translationRepository).save(any(Translation.class));
    }

    @Test
    @DisplayName("Should not save for null location")
    void shouldNotSaveForNullLocation() {
      locationTranslationService.saveLocationTranslation(null, "சென்னை");

      verify(translationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should not save for empty Tamil name")
    void shouldNotSaveForEmptyTamilName() {
      Location mockLocation = createMockLocation(1L, "Chennai");

      locationTranslationService.saveLocationTranslation(mockLocation, "");
      locationTranslationService.saveLocationTranslation(mockLocation, "   ");
      locationTranslationService.saveLocationTranslation(mockLocation, null);

      verify(translationRepository, never()).save(any());
    }
  }

  // Helper method to create mock Location
  private Location createMockLocation(Long id, String name) {
    LocationId locationId = id != null ? new LocationId(id) : null;
    return Location.withCoordinates(locationId, name, 13.0827, 80.2707);
  }
}
