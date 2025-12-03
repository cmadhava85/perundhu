package com.perundhu.domain.model;

/**
 * Enum representing supported social media platforms for route contribution
 * monitoring.
 * Part of the domain layer - no framework dependencies.
 */
public enum SocialMediaPlatform {
  TWITTER("Twitter/X", "twitter"),
  FACEBOOK("Facebook", "facebook"),
  INSTAGRAM("Instagram", "instagram"),
  YOUTUBE("YouTube", "youtube");

  private final String displayName;
  private final String code;

  SocialMediaPlatform(String displayName, String code) {
    this.displayName = displayName;
    this.code = code;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getCode() {
    return code;
  }

  public static SocialMediaPlatform fromCode(String code) {
    for (SocialMediaPlatform platform : values()) {
      if (platform.code.equalsIgnoreCase(code)) {
        return platform;
      }
    }
    throw new IllegalArgumentException("Unknown platform code: " + code);
  }
}
