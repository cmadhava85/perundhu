# GCP Cloud Monitoring Dashboard for Perundhu Bus App
# This dashboard provides visibility into application performance and errors

resource "google_monitoring_dashboard" "perundhu_app_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Perundhu Bus App - Application Monitoring"
    
    mosaicLayout = {
      columns = 12
      tiles = [
        # Row 1: Overview Stats
        {
          width  = 3
          height = 2
          widget = {
            title = "Total API Requests (Last Hour)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/api_requests_total\""
                  aggregation = {
                    alignmentPeriod    = "3600s"
                    perSeriesAligner   = "ALIGN_SUM"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
            }
          }
        },
        {
          xPos   = 3
          width  = 3
          height = 2
          widget = {
            title = "Error Rate (%)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND severity=\"ERROR\""
                  aggregation = {
                    alignmentPeriod    = "3600s"
                    perSeriesAligner   = "ALIGN_COUNT"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
              thresholds = [
                {
                  value     = 5
                  color     = "YELLOW"
                  direction = "ABOVE"
                },
                {
                  value     = 10
                  color     = "RED"
                  direction = "ABOVE"
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          width  = 3
          height = 2
          widget = {
            title = "Slow API Calls (>1s)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND textPayload=~\"SLOW METHOD\""
                  aggregation = {
                    alignmentPeriod    = "3600s"
                    perSeriesAligner   = "ALIGN_COUNT"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
              thresholds = [
                {
                  value     = 10
                  color     = "YELLOW"
                  direction = "ABOVE"
                },
                {
                  value     = 50
                  color     = "RED"
                  direction = "ABOVE"
                }
              ]
            }
          }
        },
        {
          xPos   = 9
          width  = 3
          height = 2
          widget = {
            title = "Active Users (Unique Sessions)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.sessionId!=\"\""
                  aggregation = {
                    alignmentPeriod    = "3600s"
                    perSeriesAligner   = "ALIGN_COUNT"
                    crossSeriesReducer = "REDUCE_COUNT"
                    groupByFields      = ["jsonPayload.sessionId"]
                  }
                }
              }
            }
          }
        },

        # Row 2: API Performance Charts
        {
          yPos   = 2
          width  = 6
          height = 4
          widget = {
            title = "API Response Time Distribution"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.duration!=\"\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_PERCENTILE_99"
                      }
                    }
                  }
                  plotType   = "LINE"
                  legendTemplate = "p99 Latency"
                },
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.duration!=\"\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_PERCENTILE_95"
                      }
                    }
                  }
                  plotType   = "LINE"
                  legendTemplate = "p95 Latency"
                },
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.duration!=\"\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_PERCENTILE_50"
                      }
                    }
                  }
                  plotType   = "LINE"
                  legendTemplate = "p50 Latency"
                }
              ]
              yAxis = {
                label = "Response Time (ms)"
              }
            }
          }
        },
        {
          xPos   = 6
          yPos   = 2
          width  = 6
          height = 4
          widget = {
            title = "API Requests by Endpoint"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.method!=\"\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_RATE"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["jsonPayload.method"]
                      }
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
              yAxis = {
                label = "Requests/min"
              }
            }
          }
        },

        # Row 3: Error Analysis
        {
          yPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Errors by Type"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND severity=\"ERROR\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_COUNT"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["jsonPayload.errorName"]
                      }
                    }
                  }
                  plotType = "STACKED_BAR"
                }
              ]
              yAxis = {
                label = "Error Count"
              }
            }
          }
        },
        {
          xPos   = 6
          yPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Errors by Service Method"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND severity=\"ERROR\" AND jsonPayload.method!=\"\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_COUNT"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["jsonPayload.method"]
                      }
                    }
                  }
                  plotType = "STACKED_BAR"
                }
              ]
            }
          }
        },

        # Row 4: Search & User Activity
        {
          yPos   = 10
          width  = 4
          height = 4
          widget = {
            title = "Search Queries Over Time"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.action=\"search\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_COUNT"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "Searches/min"
              }
            }
          }
        },
        {
          xPos   = 4
          yPos   = 10
          width  = 4
          height = 4
          widget = {
            title = "User Actions by Category"
            pieChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.category!=\"\""
                      aggregation = {
                        alignmentPeriod    = "3600s"
                        perSeriesAligner   = "ALIGN_COUNT"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["jsonPayload.category"]
                      }
                    }
                  }
                }
              ]
              chartType = "DONUT"
            }
          }
        },
        {
          xPos   = 8
          yPos   = 10
          width  = 4
          height = 4
          widget = {
            title = "Geocoding API Calls"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND (jsonPayload.message=~\"Nominatim\" OR textPayload=~\"Nominatim\")"
                      aggregation = {
                        alignmentPeriod  = "300s"
                        perSeriesAligner = "ALIGN_COUNT"
                      }
                    }
                  }
                  plotType       = "LINE"
                  legendTemplate = "Nominatim Calls"
                }
              ]
              yAxis = {
                label = "API Calls"
              }
            }
          }
        },

        # Row 5: Backend Performance
        {
          yPos   = 14
          width  = 6
          height = 4
          widget = {
            title = "Backend Method Execution Times"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND textPayload=~\"executed in\""
                      aggregation = {
                        alignmentPeriod  = "60s"
                        perSeriesAligner = "ALIGN_PERCENTILE_95"
                      }
                    }
                  }
                  plotType       = "LINE"
                  legendTemplate = "p95 Method Time"
                }
              ]
              yAxis = {
                label = "Execution Time (ms)"
              }
            }
          }
        },
        {
          xPos   = 6
          yPos   = 14
          width  = 6
          height = 4
          widget = {
            title = "Slow Methods (>1s) by Controller"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND textPayload=~\"SLOW METHOD\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_COUNT"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["labels.controller"]
                      }
                    }
                  }
                  plotType = "STACKED_BAR"
                }
              ]
            }
          }
        },

        # Row 6: Contribution & Bus Tracking
        {
          yPos   = 18
          width  = 4
          height = 4
          widget = {
            title = "Route Contributions"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND jsonPayload.category=\"CONTRIBUTION\""
                      aggregation = {
                        alignmentPeriod  = "3600s"
                        perSeriesAligner = "ALIGN_COUNT"
                      }
                    }
                  }
                  plotType = "STACKED_BAR"
                }
              ]
              yAxis = {
                label = "Contributions"
              }
            }
          }
        },
        {
          xPos   = 4
          yPos   = 18
          width  = 4
          height = 4
          widget = {
            title = "Image Processing Status"
            pieChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND textPayload=~\"ImageContribution\""
                      aggregation = {
                        alignmentPeriod    = "86400s"
                        perSeriesAligner   = "ALIGN_COUNT"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields      = ["labels.status"]
                      }
                    }
                  }
                }
              ]
              chartType = "DONUT"
            }
          }
        },
        {
          xPos   = 8
          yPos   = 18
          width  = 4
          height = 4
          widget = {
            title = "Bus Tracking Reports"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" AND textPayload=~\"BusTracking\""
                      aggregation = {
                        alignmentPeriod  = "300s"
                        perSeriesAligner = "ALIGN_COUNT"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        },

        # Row 7: Logs Panel
        {
          yPos   = 22
          width  = 12
          height = 4
          widget = {
            title = "Recent Errors & Warnings"
            logsPanel = {
              filter = "resource.type=\"cloud_run_revision\" AND (severity=\"ERROR\" OR severity=\"WARNING\")"
              resourceNames = ["projects/perundhu-prod"]
            }
          }
        }
      ]
    }
  })
}

# Log-based Metrics for Dashboard
resource "google_logging_metric" "api_requests_total" {
  name        = "api_requests_total"
  description = "Total API requests"
  filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.action=\"api_call\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "endpoint"
      value_type  = "STRING"
      description = "API endpoint"
    }
    labels {
      key         = "method"
      value_type  = "STRING"
      description = "HTTP method"
    }
    labels {
      key         = "success"
      value_type  = "BOOL"
      description = "Request success status"
    }
  }
  
  label_extractors = {
    "endpoint" = "EXTRACT(jsonPayload.endpoint)"
    "method"   = "EXTRACT(jsonPayload.method)"
    "success"  = "EXTRACT(jsonPayload.success)"
  }
}

resource "google_logging_metric" "api_response_time" {
  name        = "api_response_time"
  description = "API response time in milliseconds"
  filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.duration!=\"\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "DISTRIBUTION"
    unit        = "ms"
    labels {
      key         = "endpoint"
      value_type  = "STRING"
    }
  }
  
  value_extractor = "EXTRACT(jsonPayload.duration)"
  
  bucket_options {
    exponential_buckets {
      num_finite_buckets = 20
      growth_factor      = 2
      scale              = 10
    }
  }
  
  label_extractors = {
    "endpoint" = "EXTRACT(jsonPayload.endpoint)"
  }
}

resource "google_logging_metric" "slow_methods" {
  name        = "slow_methods"
  description = "Count of slow method executions (>1s)"
  filter      = "resource.type=\"cloud_run_revision\" AND textPayload=~\"SLOW METHOD\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "method"
      value_type  = "STRING"
    }
  }
  
  label_extractors = {
    "method" = "REGEXP_EXTRACT(textPayload, \"SLOW METHOD: ([^(]+)\")"
  }
}

resource "google_logging_metric" "search_queries" {
  name        = "search_queries"
  description = "Search query count"
  filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.action=\"search\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "results_count"
      value_type  = "INT64"
    }
  }
  
  label_extractors = {
    "results_count" = "EXTRACT(jsonPayload.resultsCount)"
  }
}

resource "google_logging_metric" "user_actions" {
  name        = "user_actions"
  description = "User action tracking"
  filter      = "resource.type=\"cloud_run_revision\" AND jsonPayload.category!=\"\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "category"
      value_type  = "STRING"
    }
    labels {
      key         = "action"
      value_type  = "STRING"
    }
  }
  
  label_extractors = {
    "category" = "EXTRACT(jsonPayload.category)"
    "action"   = "EXTRACT(jsonPayload.action)"
  }
}

resource "google_logging_metric" "errors_by_type" {
  name        = "errors_by_type"
  description = "Error count by type"
  filter      = "resource.type=\"cloud_run_revision\" AND severity=\"ERROR\""
  
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key         = "error_name"
      value_type  = "STRING"
    }
  }
  
  label_extractors = {
    "error_name" = "EXTRACT(jsonPayload.errorName)"
  }
}

# Alerting Policies
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High Error Rate Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "Error rate > 5%"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/errors_by_type\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = []  # Add your notification channel IDs
  
  alert_strategy {
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "slow_api_response" {
  display_name = "Slow API Response Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "p95 latency > 3s"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/api_response_time\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 3000
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
    }
  }
  
  notification_channels = []  # Add your notification channel IDs
}

resource "google_monitoring_alert_policy" "many_slow_methods" {
  display_name = "Many Slow Methods Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "Slow methods > 50 in 5 minutes"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/slow_methods\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 50
      
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }
  
  notification_channels = []  # Add your notification channel IDs
}
