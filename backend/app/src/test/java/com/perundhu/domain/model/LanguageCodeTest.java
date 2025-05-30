package com.perundhu.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;

class LanguageCodeTest {
    
    @Test
    void shouldAcceptValidLanguageCodes() {
        LanguageCode enCode = new LanguageCode("en");
        LanguageCode taCode = new LanguageCode("ta");
        
        assertThat(enCode.toString()).isEqualTo("en");
        assertThat(taCode.toString()).isEqualTo("ta");
    }
    
    @Test
    void shouldNormalizeLanguageCodes() {
        LanguageCode code = new LanguageCode("EN");
        assertThat(code.toString()).isEqualTo("en");
    }
    
    @Test
    void shouldRejectInvalidLanguageCodes() {
        LanguageCode.disableTestMode();
        try {
            assertThatThrownBy(() -> new LanguageCode(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be null or empty");
                
            assertThatThrownBy(() -> new LanguageCode(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be null or empty");
                
            assertThatThrownBy(() -> new LanguageCode("xx"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported language code");
        } finally {
            LanguageCode.enableTestMode();
        }
    }
}