package com.perundhu.infrastructure.service;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class TranslatableProxyTest {

    @Test
    void shouldReturnCorrectEntityType() {
        TranslatableProxy proxy = new TranslatableProxyImpl("location", 1L);
        assertThat(proxy.getEntityType()).isEqualTo("location");
    }

    @Test
    void shouldReturnCorrectId() {
        TranslatableProxy proxy = new TranslatableProxyImpl("bus", 123L);
        assertThat(proxy.getEntityIdAsString()).isEqualTo("123"); // Using getEntityIdAsString instead of getEntityId
    }

    // The following test is not valid because getTranslations() does not exist on TranslatableProxyImpl
    // @Test
    // void shouldReturnEmptyTranslationsList() {
    //     TranslatableProxy proxy = new TranslatableProxyImpl("stop", 1L);
    //     assertThat(proxy.getTranslations()).isEmpty();
    // }

    // The following test is not valid because addTranslation() does not exist on TranslatableProxyImpl
    // @Test
    // void shouldIgnoreAddTranslation() {
    //     TranslatableProxy proxy = new TranslatableProxyImpl("test", 1L);
    //     proxy.addTranslation("name", "en", "Test");
    //     assertThat(proxy.getTranslations()).isEmpty();
    // }
}