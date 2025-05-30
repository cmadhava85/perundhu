package com.perundhu.repository;

import java.sql.Connection;
import java.sql.ResultSet;
import java.util.List;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.model.LanguageCode;
import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TranslationRepositoryIntegrationTest {

    @Autowired
    private TranslationJpaRepository translationRepository;
    
    @Autowired
    private DataSource dataSource;
    
    @Test
    void shouldUseIndexForQueries() throws Exception {
        // Given - create test data
        createTestData();
        
        // When - query with conditions that should use the index
        try (Connection conn = dataSource.getConnection()) {
            // Test entity_lang index
            try (ResultSet rs = conn.createStatement().executeQuery(
                "EXPLAIN ANALYZE SELECT * FROM translations WHERE entity_type = 'test' AND entity_id = 1 AND language_code = 'en'")) {
                rs.next();
                String plan = rs.getString(1).toLowerCase();
                assertThat(plan).contains("index").contains("idx_entity_lang");
            }
            
            // Test entity_lang_field index
            try (ResultSet rs = conn.createStatement().executeQuery(
                "EXPLAIN ANALYZE SELECT * FROM translations WHERE entity_type = 'test' AND entity_id = 1 AND language_code = 'en' AND field_name = 'name'")) {
                rs.next();
                String plan = rs.getString(1).toLowerCase();
                assertThat(plan).contains("index").contains("idx_entity_lang_field");
            }
        }
    }
    
    @Test
    void shouldRetrieveTranslationsEfficiently() {
        // Given
        createTestData();
        
        // When
        List<TranslationJpaEntity> translations = translationRepository
            .findByEntityTypeAndEntityIdAndLanguageCode("test", 1L, "en");
            
        // Then
        assertThat(translations).hasSize(2);
        assertThat(translations).extracting("fieldName")
            .containsExactlyInAnyOrder("name", "description");
    }
    
    private void createTestData() {
        TranslationJpaEntity translation1 = new TranslationJpaEntity(
            "test", 1L, "name", new LanguageCode("en"), "Test Entity");
        TranslationJpaEntity translation2 = new TranslationJpaEntity(
            "test", 1L, "description", new LanguageCode("en"), "Test Description");
        TranslationJpaEntity translation3 = new TranslationJpaEntity(
            "test", 1L, "name", new LanguageCode("ta"), "சோதனை");
            
        translationRepository.saveAll(List.of(translation1, translation2, translation3));
    }
}