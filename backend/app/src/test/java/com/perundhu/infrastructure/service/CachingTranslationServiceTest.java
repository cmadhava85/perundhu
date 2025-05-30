package com.perundhu.infrastructure.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.perundhu.domain.model.LanguageCode;
import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;
import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CachingTranslationServiceTest {
    
    @Mock
    private TranslationJpaRepository translationRepository;
    
    private CachingTranslationService cachingTranslationService;
    
    @BeforeAll
    static void setUpClass() {
        // Enable test mode for all tests in this class
        LanguageCode.enableTestMode();
    }
    
    @BeforeEach
    void setUp() {
        // Ensure test mode is enabled before each test
        LanguageCode.enableTestMode();
        // Create actual service instance with test mode enabled
        cachingTranslationService = new CachingTranslationServiceImpl(translationRepository, true);
    }
    
    // Test implementation for Translatable
    static class TestTranslatableProxy implements Translatable<Object> {
        private final String entityType;
        private final Long entityId;
        private final String defaultValue;
        public TestTranslatableProxy(String entityType, Long entityId) {
            this(entityType, entityId, null);
        }
        public TestTranslatableProxy(String entityType, Long entityId, String defaultValue) {
            this.entityType = entityType;
            this.entityId = entityId;
            this.defaultValue = defaultValue;
        }
        @Override
        public String getEntityType() { return entityType; }
        @Override
        public Long getEntityId() { return entityId; }
        @Override
        public Long getTranslationId() { return entityId; }
        @Override
        public String getDefaultValue(String fieldName) { return defaultValue != null ? defaultValue : ""; }
        @Override
        public List<Translation> getTranslations() { return List.of(); }
    }
    
    @Test
    void shouldCacheTranslations() {
        // Given
        Translatable<Object> testEntity = new TestTranslatableProxy("test", 1L);
        
        TranslationJpaEntity translation = new TranslationJpaEntity();
        translation.setEntityType("test");
        translation.setEntityId(1L);
        translation.setFieldName("name");
        translation.setLanguageCode("en");
        translation.setTranslatedValue("Test Entity");
        
        when(translationRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            anyString(), anyLong(), anyString(), anyString()))
            .thenReturn(Optional.of(translation));
            
        // When - first call
        String result1 = cachingTranslationService.getTranslation(testEntity, "name", "en");
        // When - second call (should be from cache)
        String result2 = cachingTranslationService.getTranslation(testEntity, "name", "en");
        
        // Then
        assertThat(result1).isEqualTo("Test Entity");
        assertThat(result2).isEqualTo("Test Entity");
        
        // Verify repository was called only once due to caching
        verify(translationRepository, times(1)).findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            anyString(), anyLong(), anyString(), anyString());
    }
    
    @Test
    void shouldEvictCacheOnSave() {
        // Given
        Translatable<Object> testEntity = new TestTranslatableProxy("test", 1L);
        
        TranslationJpaEntity oldTranslation = new TranslationJpaEntity();
        oldTranslation.setEntityType("test");
        oldTranslation.setEntityId(1L);
        oldTranslation.setFieldName("name");
        oldTranslation.setLanguageCode("en");
        oldTranslation.setTranslatedValue("Old Name");
        
        TranslationJpaEntity newTranslation = new TranslationJpaEntity();
        newTranslation.setEntityType("test");
        newTranslation.setEntityId(1L);
        newTranslation.setFieldName("name");
        newTranslation.setLanguageCode("en");
        newTranslation.setTranslatedValue("New Name");
        
        when(translationRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            anyString(), anyLong(), anyString(), anyString()))
            .thenReturn(Optional.of(oldTranslation))
            .thenReturn(Optional.of(newTranslation));
            
        // Mock repository.save to avoid LanguageCode validation issues
        when(translationRepository.save(any(TranslationJpaEntity.class))).thenReturn(newTranslation);
            
        // When - first get
        String result1 = cachingTranslationService.getTranslation(testEntity, "name", "en");
        // When - save new value
        cachingTranslationService.saveTranslation(testEntity, "name", "en", "New Name");
        // When - second get (should hit repository again)
        String result2 = cachingTranslationService.getTranslation(testEntity, "name", "en");
        
        // Then
        assertThat(result1).isEqualTo("Old Name");
        assertThat(result2).isEqualTo("New Name");
        
        // Verify repository was called twice due to cache eviction
        verify(translationRepository, times(2)).findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            anyString(), anyLong(), anyString(), anyString());
    }
    
    @Test
    void shouldGetAllTranslations() {
        // Given
        Translatable<Object> testEntity = new TestTranslatableProxy("test", 1L);
        
        TranslationJpaEntity translation1 = new TranslationJpaEntity();
        translation1.setEntityType("test");
        translation1.setEntityId(1L);
        translation1.setFieldName("name");
        translation1.setLanguageCode("en");
        translation1.setTranslatedValue("Name");
        
        TranslationJpaEntity translation2 = new TranslationJpaEntity();
        translation2.setEntityType("test");
        translation2.setEntityId(1L);
        translation2.setFieldName("description");
        translation2.setLanguageCode("en");
        translation2.setTranslatedValue("Description");
        
        when(translationRepository.findByEntityTypeAndEntityIdAndLanguageCode(
            anyString(), anyLong(), anyString()))
            .thenReturn(Arrays.asList(translation1, translation2));
            
        // When
        Map<String, String> translations = cachingTranslationService.getAllTranslations(testEntity, "en");
        
        // Then
        assertThat(translations)
            .containsEntry("name", "Name")
            .containsEntry("description", "Description");
    }
}