# Copilot Instructions for Perundhu

## Project Overview
Perundhu is a community-powered bus route finder app for Tamil Nadu deployed on GCP (project: `perundhu-prod-001`, region: `us-central1`).
Stack: Java 21 / Spring Boot backend on Cloud Run, React frontend on Cloud Run, Cloud SQL MySQL (`db-f1-micro`), Terraform IaC.

---

## Budget Constraint — Read Before Suggesting Any Change

**Monthly budget ceiling: $25–30 USD.**

Significant cost optimization work has already been completed (60+ hours of effort across Jan–Mar 2026).
The infrastructure was deliberately trimmed from ~$60/month down to ~$2–25/month depending on traffic.
**Do not suggest or introduce changes that increase GCP spend without explicitly flagging the cost impact.**

Before recommending any new GCP service, infrastructure change, or configuration tweak, answer:
> "Does this increase monthly cost? If yes, by how much, and does it fit within the $25–30/month ceiling?"

If you cannot answer that, say so — do not proceed silently.

---

## Locked Cost-Optimized Settings

These settings are intentional and must not be changed without explicit confirmation:

### Cloud Run
| Setting | Value | Reason |
|---|---|---|
| `cloud_run_min_instances` | `0` | Scale-to-zero saves ~$6.50/month |
| `cloud_run_max_instances` | `5` | Hard cap to prevent runaway scaling cost |
| `cloud_run_cpu_limit` | `1000m` (1 vCPU) | Sufficient for current load |
| `cloud_run_memory_limit` | `512Mi` | Backend right-sized; JVM tuned for this |
| Startup CPU boost | enabled | Mitigates cold-start latency from scale-to-zero |

### Cloud SQL
| Setting | Value | Reason |
|---|---|---|
| `db_instance_tier` | `db-f1-micro` | Saves ~$20/month vs db-n1-standard-1 |
| `db_availability_type` | `ZONAL` | No HA failover — saves ~$34/month |
| `db_disk_type` | `PD_HDD` | Cheaper than SSD; acceptable for this workload |
| `db_disk_size` | `10 GB` | Minimum; autoresize capped at 100 GB |
| `db_backup_retained_backups_count` | `3` | Reduced from 7 (saves storage cost) |
| `db_transaction_log_retention_days` | `3` | Reduced from 7 |
| `db_binary_log_enabled` | `false` | No read replica; keeping this off saves ~$0.50/month |
| `db_general_log_enabled` | `false` | Avoid performance overhead; enable only for debugging |
| `db_activation_policy` | `ALWAYS` | DB must stay running in production |

### VPC / Networking
| Setting | Value | Reason |
|---|---|---|
| VPC Connector | **DISABLED** | Saves $14/month; Cloud Run uses public IP to Cloud SQL |
| Cloud SQL public IP | `use_public_ip = true` | Required because VPC connector is disabled |

### Artifact Registry
- 30-day image retention policy is applied. Do not suggest increasing this.

### HikariCP (Backend Connection Pool)
- `maximumPoolSize = 10` (reduced from 50). Do not increase without load-test justification.

---

## Do Not Suggest the Following Without Explicit Cost Justification

- Upgrading `db-f1-micro` to any larger tier
- Setting `min_instances > 0` on Cloud Run
- Re-enabling the VPC Connector (`perundhu-connector` or `perundhu-prod-vpc-conn`)
- Enabling read replicas or Cloud SQL HA (`REGIONAL` availability)
- Adding new GCP services (Cloud Memorystore/Redis, Pub/Sub, additional Cloud Scheduler jobs, etc.)
- Enabling Cloud CDN or additional load balancer features that incur per-GB charges
- Switching disk type from `PD_HDD` to `PD_SSD`
- Enabling binary logging on Cloud SQL
- Adding Cloud Armor, WAF rules, or advanced DDoS protection at cost
- Increasing Artifact Registry retention beyond 30 days
- Adding new Cloud Run services without assessing max-instances impact

---

## Cost-Safe Patterns to Prefer

- **Scale-to-zero** over reserved/always-on instances.
- **Cloud SQL proxy** (built-in Cloud Run sidecar) over VPC connectors.
- **Caching at the application layer** (in-memory, React state, `useMemo`) before reaching for Redis/Memorystore.
- **Batch API calls / debounce** frontend requests before adding backend infrastructure.
- **Single-region, single-zone** deployment unless HA is a stated requirement.
- **PD-HDD** for non-IOPS-critical databases.
- **Terraform `terraform.tfvars`** as the single source of truth for resource sizing — no ad-hoc `gcloud` overrides that drift from IaC.

---

## Coding Conventions

- **Robust, minimal code** — avoid over-engineering; only add what is directly required.
- **No unnecessary comments or docstrings** on unchanged code.
- **Frontend performance**: use `useMemo`/`useCallback` to prevent unnecessary re-renders that drive up API call counts (which affect Cloud Run invocation billing).
- **Backend**: prefer connection reuse (HikariCP pooling, keep-alives) over new connections per request.
- **API design**: prefer pagination over returning full datasets to keep response sizes and Cloud Run CPU time low.

---

## Raising the Budget

If a feature genuinely requires more infrastructure, explicitly state:
1. What new cost will be introduced ($/month estimate).
2. Whether it stays within the $25–30/month ceiling.
3. What existing cost, if any, it replaces or offsets.

Then wait for confirmation before implementing.
