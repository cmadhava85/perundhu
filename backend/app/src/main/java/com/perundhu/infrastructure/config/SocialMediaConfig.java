package com.perundhu.infrastructure.config;

import com.perundhu.adapter.out.socialmedia.TwitterApiAdapter;
import com.perundhu.adapter.out.socialmedia.FacebookApiAdapter;
import com.perundhu.adapter.out.socialmedia.InstagramApiAdapter;
import com.perundhu.domain.port.output.TwitterApiOutputPort;
import com.perundhu.domain.port.output.FacebookApiOutputPort;
import com.perundhu.domain.port.output.InstagramApiOutputPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring configuration for social media integration.
 * Creates beans for API adapters based on configuration properties.
 */
@Configuration
@EnableConfigurationProperties(SocialMediaProperties.class)
@ConditionalOnProperty(prefix = "socialmedia", name = "enabled", havingValue = "true", matchIfMissing = false)
public class SocialMediaConfig {

  @Bean
  @ConditionalOnProperty(prefix = "socialmedia.twitter", name = "enabled", havingValue = "true", matchIfMissing = false)
  public TwitterApiOutputPort twitterApiOutputPort(SocialMediaProperties properties) {
    return new TwitterApiAdapter(properties.getTwitter());
  }

  @Bean
  @ConditionalOnProperty(prefix = "socialmedia.facebook", name = "enabled", havingValue = "true", matchIfMissing = false)
  public FacebookApiOutputPort facebookApiOutputPort(SocialMediaProperties properties) {
    return new FacebookApiAdapter(properties.getFacebook());
  }

  @Bean
  @ConditionalOnProperty(prefix = "socialmedia.instagram", name = "enabled", havingValue = "true", matchIfMissing = false)
  public InstagramApiOutputPort instagramApiOutputPort(SocialMediaProperties properties) {
    return new InstagramApiAdapter(properties.getInstagram());
  }
}
