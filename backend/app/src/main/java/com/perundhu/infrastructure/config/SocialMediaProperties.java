package com.perundhu.infrastructure.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for social media integration.
 * Maps to application.yml properties under 'socialmedia' prefix.
 */
@ConfigurationProperties(prefix = "socialmedia")
public class SocialMediaProperties {

  private boolean enabled = false;
  private MonitoringConfig monitoring = new MonitoringConfig();
  private TwitterConfig twitter = new TwitterConfig();
  private FacebookConfig facebook = new FacebookConfig();
  private InstagramConfig instagram = new InstagramConfig();

  // Getters and setters

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public MonitoringConfig getMonitoring() {
    return monitoring;
  }

  public void setMonitoring(MonitoringConfig monitoring) {
    this.monitoring = monitoring;
  }

  public TwitterConfig getTwitter() {
    return twitter;
  }

  public void setTwitter(TwitterConfig twitter) {
    this.twitter = twitter;
  }

  public FacebookConfig getFacebook() {
    return facebook;
  }

  public void setFacebook(FacebookConfig facebook) {
    this.facebook = facebook;
  }

  public InstagramConfig getInstagram() {
    return instagram;
  }

  public void setInstagram(InstagramConfig instagram) {
    this.instagram = instagram;
  }

  // Nested configuration classes

  public static class MonitoringConfig {
    private String schedule = "0 */5 * * * ?"; // Every 5 minutes

    public String getSchedule() {
      return schedule;
    }

    public void setSchedule(String schedule) {
      this.schedule = schedule;
    }
  }

  public static class TwitterConfig {
    private boolean enabled = false;
    private String apiKey;
    private String apiSecret;
    private String accessToken;
    private String accessTokenSecret;
    private String accountHandle = "@PerundhuRoutes";
    private List<String> brandedHashtags = new ArrayList<>(List.of("PerundhuRoutes", "PerundhuBus", "ShareBusRoute"));
    private List<String> communityHashtags = new ArrayList<>(List.of("TNSTCbus", "MTCBus", "TamilNaduBus"));

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getApiKey() {
      return apiKey;
    }

    public void setApiKey(String apiKey) {
      this.apiKey = apiKey;
    }

    public String getApiSecret() {
      return apiSecret;
    }

    public void setApiSecret(String apiSecret) {
      this.apiSecret = apiSecret;
    }

    public String getAccessToken() {
      return accessToken;
    }

    public void setAccessToken(String accessToken) {
      this.accessToken = accessToken;
    }

    public String getAccessTokenSecret() {
      return accessTokenSecret;
    }

    public void setAccessTokenSecret(String accessTokenSecret) {
      this.accessTokenSecret = accessTokenSecret;
    }

    public String getAccountHandle() {
      return accountHandle;
    }

    public void setAccountHandle(String accountHandle) {
      this.accountHandle = accountHandle;
    }

    public List<String> getBrandedHashtags() {
      return brandedHashtags;
    }

    public void setBrandedHashtags(List<String> brandedHashtags) {
      this.brandedHashtags = brandedHashtags;
    }

    public List<String> getCommunityHashtags() {
      return communityHashtags;
    }

    public void setCommunityHashtags(List<String> communityHashtags) {
      this.communityHashtags = communityHashtags;
    }

    public boolean isConfigured() {
      return enabled && apiKey != null && !apiKey.isEmpty() &&
          apiSecret != null && !apiSecret.isEmpty() &&
          accessToken != null && !accessToken.isEmpty() &&
          accessTokenSecret != null && !accessTokenSecret.isEmpty();
    }
  }

  public static class FacebookConfig {
    private boolean enabled = false;
    private String pageId;
    private String accessToken;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getPageId() {
      return pageId;
    }

    public void setPageId(String pageId) {
      this.pageId = pageId;
    }

    public String getAccessToken() {
      return accessToken;
    }

    public void setAccessToken(String accessToken) {
      this.accessToken = accessToken;
    }

    public boolean isConfigured() {
      return enabled && pageId != null && !pageId.isEmpty() &&
          accessToken != null && !accessToken.isEmpty();
    }
  }

  public static class InstagramConfig {
    private boolean enabled = false;
    private String userId;
    private String accessToken;
    private String brandedHashtag = "PerundhuRoutes";

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getUserId() {
      return userId;
    }

    public void setUserId(String userId) {
      this.userId = userId;
    }

    public String getAccessToken() {
      return accessToken;
    }

    public void setAccessToken(String accessToken) {
      this.accessToken = accessToken;
    }

    public String getBrandedHashtag() {
      return brandedHashtag;
    }

    public void setBrandedHashtag(String brandedHashtag) {
      this.brandedHashtag = brandedHashtag;
    }

    public boolean isConfigured() {
      return enabled && userId != null && !userId.isEmpty() &&
          accessToken != null && !accessToken.isEmpty();
    }
  }
}
