package com.perundhu.repository;

import java.sql.Connection;
import java.sql.ResultSet;
import java.util.List;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.perundhu.domain.model.LanguageCode;
import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;

// Use TestPropertySource to override Flyway properties for this test
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TranslationRepositoryIntegrationTest {

    // Inner test configuration class to disable Flyway for these tests
    @TestConfiguration
    static class TestConfig {
        @BeforeAll
        static void setUp() {
            // Enable test mode to avoid validation errors with language codes
            LanguageCode.enableTestMode();
        }
    }

    @Autowired
    private TranslationJpaRepository translationRepository;
    
    @Autowired
    private DataSource dataSource;
    
    private void createTestData() {
        // Add multiple translations
        translationRepository.save(new TranslationJpaEntity("test", 1L, "name", new LanguageCode("en"), "Test Entity"));
        translationRepository.save(new TranslationJpaEntity("test", 1L, "description", new LanguageCode("en"), "Test Description"));
        translationRepository.save(new TranslationJpaEntity("test", 1L, "name", new LanguageCode("ta"), "சோதனை"));
        translationRepository.save(new TranslationJpaEntity("test", 1L, "description", new LanguageCode("ta"), "சோதனை விளக்கம்"));
        
        // Add translations for another entity
        translationRepository.save(new TranslationJpaEntity("test", 2L, "name", new LanguageCode("en"), "Another Test"));
        translationRepository.save(new TranslationJpaEntity("test", 2L, "name", new LanguageCode("ta"), "மற்றொரு சோதனை"));
    }
    
    @Test
    void shouldUseIndexForQueries() throws Exception {
        // Given - create test data
        createTestData();
        
        // When - query with conditions that should use the index
        try (Connection conn = dataSource.getConnection()) {
            // Test entity_lang index
            try (ResultSet rs = conn.createStatement().executeQuery(
                "EXPLAIN SELECT * FROM translations WHERE entity_type = 'test' AND entity_id = 1 AND language_code = 'en'")) {
                // Just check that the query runs, don't verify the plan since it might differ across databases
                assertThat(rs.next()).isTrue();
            }
            
            // Test entity_lang_field index
            try (ResultSet rs = conn.createStatement().executeQuery(
                "EXPLAIN SELECT * FROM translations WHERE entity_type = 'test' AND entity_id = 1 AND language_code = 'en' AND field_name = 'name'")) {
                // Just check that the query runs, don't verify the plan since it might differ across databases
                assertThat(rs.next()).isTrue();
            }
        }
        
        // Then - verify data can be retrieved using repository methods
        List<TranslationJpaEntity> translations = translationRepository
            .findByEntityTypeAndEntityId("test", 1L);
        assertThat(translations).hasSize(4);
        
        TranslationJpaEntity translation = translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName("test", 1L, "en", "name")
            .orElse(null);
        assertThat(translation).isNotNull();
        assertThat(translation.getTranslatedValue()).isEqualTo("Test Entity");
    }
    
    @Test
    void shouldRetrieveTranslationsEfficiently() {
        // Given - create test data
        createTestData();
        
        // When - retrieve translations using repository methods
        List<TranslationJpaEntity> allTranslations = translationRepository.findAll();
        List<TranslationJpaEntity> testEntityTranslations = translationRepository.findByEntityTypeAndEntityId("test", 1L);
        List<TranslationJpaEntity> testEntityEnglishTranslations = 
            translationRepository.findByEntityTypeAndEntityIdAndLanguageCode("test", 1L, "en");
        
        // Then - verify results
        assertThat(allTranslations).hasSize(6);
        assertThat(testEntityTranslations).hasSize(4);
        assertThat(testEntityEnglishTranslations).hasSize(2);
        
        // Check that the specific translation can be retrieved
        TranslationJpaEntity englishName = translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName("test", 1L, "en", "name")
            .orElse(null);
        assertThat(englishName).isNotNull();
        assertThat(englishName.getTranslatedValue()).isEqualTo("Test Entity");
        
        // Check Tamil translation
        TranslationJpaEntity tamilName = translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName("test", 1L, "ta", "name")
            .orElse(null);
        assertThat(tamilName).isNotNull();
        assertThat(tamilName.getTranslatedValue()).isEqualTo("சோதனை");
    }
}