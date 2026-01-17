import functions_framework
import os
import logging
import requests
from google.cloud import monitoring_v3
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from datetime import datetime, timedelta
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get default credentials
from google.auth import default as google_auth_default
credentials, project_id = google_auth_default()


@functions_framework.http
def auto_stop_idle_sql(request):
    """
    HTTP Cloud Function to auto-stop idle Cloud SQL instances.
    Triggered by Cloud Scheduler.
    """
    try:
        # Get environment variables
        project_id = os.environ.get("PROJECT_ID")
        sql_instance_name = os.environ.get("SQL_INSTANCE_NAME")
        idle_minutes_threshold = int(os.environ.get("IDLE_MINUTES", "30"))
        dry_run_mode = os.environ.get("DRY_RUN", "false").lower() == "true"

        logger.info(
            f"Auto-stop SQL check: project={project_id}, instance={sql_instance_name}, "
            f"idle_threshold={idle_minutes_threshold}m, dry_run={dry_run_mode}"
        )

        # Initialize clients
        monitoring_client = monitoring_v3.QueryServiceClient()

        # Get credentials for API calls
        request = Request()
        credentials.refresh(request)
        
        # Get the SQL instance details using REST API
        url = f"https://sqladmin.googleapis.com/v1/projects/{project_id}/instances/{sql_instance_name}"
        headers = {"Authorization": f"Bearer {credentials.token}"}
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Failed to get instance: {response.status_code} - {response.text}")
        
        instance = response.json()
        instance_state = instance.get("state", "UNKNOWN")

        logger.info(f"Instance state: {instance_state}, database_version: {instance.get('databaseVersion', 'unknown')}")

        # If instance is already stopped, no need to proceed
        if instance_state == "STOPPED":
            logger.info(f"Instance {sql_instance_name} is already stopped")
            return {
                "status": "success",
                "message": f"Instance {sql_instance_name} is already stopped",
                "instance_state": instance_state,
                "action_taken": False,
            }, 200

        # Check if instance has active connections using monitoring metrics
        has_active_connections = check_active_connections(
            project_id, sql_instance_name, monitoring_client
        )

        if has_active_connections:
            logger.info(
                f"Instance {sql_instance_name} has active connections. Not stopping."
            )
            return {
                "status": "success",
                "message": f"Instance {sql_instance_name} has active connections. Not stopping.",
                "instance_state": instance_state,
                "action_taken": False,
                "has_active_connections": True,
            }, 200

        # Instance is idle - proceed with stopping if not in dry-run mode
        if dry_run_mode:
            logger.info(
                f"[DRY RUN] Would stop instance {sql_instance_name}"
            )
            return {
                "status": "success",
                "message": f"[DRY RUN] Would stop instance {sql_instance_name}",
                "instance_state": instance_state,
                "action_taken": False,
                "dry_run": True,
            }, 200

        # Stop the instance using REST API
        logger.info(f"Stopping instance {sql_instance_name}...")
        
        patch_url = f"https://sqladmin.googleapis.com/v1/projects/{project_id}/instances/{sql_instance_name}"
        patch_data = {
            "settings": {
                "activationPolicy": "NEVER"
            }
        }
        
        patch_response = requests.patch(patch_url, headers=headers, json=patch_data, timeout=30)
        if patch_response.status_code not in [200, 201]:
            raise Exception(f"Failed to patch instance: {patch_response.status_code} - {patch_response.text}")
        
        operation = patch_response.json()
        operation_name = operation.get("name", "unknown")
        
        logger.info(f"Stop operation initiated: {operation_name}")

        return {
            "status": "success",
            "message": f"Instance {sql_instance_name} is being stopped",
            "instance_state": instance_state,
            "action_taken": True,
            "operation_name": operation_name,
            "timestamp": datetime.now().isoformat(),
        }, 200

    except Exception as e:
        logger.error(f"Error in auto_stop_idle_sql: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat(),
        }, 500


def check_active_connections(project_id, instance_name, monitoring_client):
    """
    Check if a Cloud SQL instance has active connections.
    Returns True if there are active connections, False otherwise.
    """
    try:
        # Query Cloud Monitoring for the number of active connections
        # Metric: cloudsql.googleapis.com/database/mysql/connections
        interval = monitoring_v3.TimeInterval(
            {
                "end_time": {"seconds": int(datetime.now().timestamp())},
                "start_time": {
                    "seconds": int(
                        (datetime.now() - timedelta(minutes=5)).timestamp()
                    )
                },
            }
        )

        # Build the query - check for non-zero connections in the last 5 minutes
        query = (
            f'resource.type="cloudsql_database" AND '
            f'resource.labels.database_id="{project_id}:{instance_name}" AND '
            f'metric.type="cloudsql.googleapis.com/database/mysql/connections"'
        )

        request = monitoring_v3.QueryTimeSeriesRequest(
            {
                "name": f"projects/{project_id}",
                "query": query,
            }
        )

        results = monitoring_client.query_time_series(request=request)

        # Check if any data points show active connections
        for time_series in results.time_series_data:
            for point in time_series.point_data:
                if point.values and len(point.values) > 0:
                    value = point.values[0].double_value or point.values[0].int64_value
                    if value and value > 0:
                        logger.info(
                            f"Found {value} active connections for {instance_name}"
                        )
                        return True

        logger.info(f"No active connections found for {instance_name}")
        return False

    except Exception as e:
        # If we can't check connections, assume active to be safe
        logger.warning(
            f"Could not check active connections for {instance_name}: {str(e)}. Assuming active."
        )
        return True
