"""
Cloud Function to automatically stop idle Cloud SQL instances.

Checks if there are active connections in the last 30 minutes.
If no connections found, stops the instance to save costs.
"""

import functions_framework
from google.cloud import monitoring_v3
from datetime import datetime, timedelta
import os
import json
import subprocess


def get_instance_state(project_id: str, instance_name: str) -> str:
    """Get current state of Cloud SQL instance using gcloud"""
    try:
        result = subprocess.run(
            [
                "gcloud", "sql", "instances", "describe", instance_name,
                f"--project={project_id}",
                "--format=value(state)"
            ],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return "UNKNOWN"
    except Exception as e:
        print(f"Error getting instance state: {e}")
        return "UNKNOWN"


def check_active_connections(project_id: str, instance_id: str, minutes: int = 30) -> int:
    """
    Check if there are active database connections in the last N minutes.
    Returns the max connection count in that period.
    """
    try:
        client = monitoring_v3.QueryServiceClient()
        
        # Build the time interval
        now = datetime.utcnow()
        end_time = now
        start_time = now - timedelta(minutes=minutes)
        
        # Query for active connections metric
        query = f"""
        fetch cloudsql_database
        | metric 'cloudsql.googleapis.com/database/network/connections'
        | filter resource.database_id == '{project_id}:{instance_id}'
        | group_by [], [value_connections_max: max(value.connections)]
        | within {minutes}m
        """
        
        request = monitoring_v3.QueryTimeSeriesRequest(
            name=f"projects/{project_id}",
            query=query,
        )
        
        page_result = client.query_time_series(request=request)
        
        max_connections = 0
        for time_series_data in page_result:
            for point in time_series_data.point_data:
                for value in point.values:
                    if hasattr(value, 'int64_value'):
                        max_connections = max(max_connections, value.int64_value)
        
        return max_connections
        
    except Exception as e:
        print(f"Error checking connections: {e}")
        # If can't get metrics, assume there are connections (safer)
        return 1


def stop_sql_instance(project_id: str, instance_name: str) -> bool:
    """Stop a Cloud SQL instance using gcloud"""
    try:
        result = subprocess.run(
            [
                "gcloud", "sql", "instances", "patch", instance_name,
                "--activation-policy=NEVER",
                f"--project={project_id}",
                "--quiet"
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"✅ Stopping instance {instance_name}...")
            return True
        else:
            print(f"❌ Error stopping instance: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error stopping instance: {e}")
        return False


@functions_framework.http
def auto_stop_idle_sql(request):
    """
    HTTP Cloud Function to stop idle Cloud SQL instances.
    
    Environment Variables:
    - PROJECT_ID: GCP project ID
    - SQL_INSTANCE_NAME: Cloud SQL instance name
    - IDLE_MINUTES: Minutes of inactivity before stopping (default: 30)
    - DRY_RUN: Set to 'true' to only check without stopping
    """
    
    # Get configuration from environment variables
    project_id = os.environ.get('PROJECT_ID', 'astute-strategy-406601')
    instance_name = os.environ.get('SQL_INSTANCE_NAME', 'perundhu-preprod-mysql')
    idle_minutes = int(os.environ.get('IDLE_MINUTES', '30'))
    dry_run = os.environ.get('DRY_RUN', 'false').lower() == 'true'
    
    print(f"🔍 Checking Cloud SQL instance: {instance_name}")
    print(f"⏱️  Idle threshold: {idle_minutes} minutes")
    print(f"🧪 Dry run mode: {dry_run}")
    
    # Check current instance state
    current_state = get_instance_state(project_id, instance_name)
    print(f"📊 Current state: {current_state}")
    
    if current_state == "STOPPED":
        result = {
            "status": "skipped",
            "message": f"Instance {instance_name} is already stopped",
            "instance": instance_name,
            "state": current_state
        }
        print(f"⏭️  {result['message']}")
        return json.dumps(result), 200
    
    if current_state != "RUNNABLE":
        result = {
            "status": "skipped",
            "message": f"Instance {instance_name} is in {current_state} state, not stopping",
            "instance": instance_name,
            "state": current_state
        }
        print(f"⚠️  {result['message']}")
        return json.dumps(result), 200
    
    # Check for active connections
    max_connections = check_active_connections(project_id, instance_name, idle_minutes)
    print(f"🔌 Max connections in last {idle_minutes} minutes: {max_connections}")
    
    if max_connections > 0:
        result = {
            "status": "active",
            "message": f"Instance {instance_name} has {max_connections} active connections, not stopping",
            "instance": instance_name,
            "connections": max_connections,
            "idle_minutes": idle_minutes
        }
        print(f"✅ {result['message']}")
        return json.dumps(result), 200
    
    # Instance is idle, stop it
    if dry_run:
        result = {
            "status": "dry_run",
            "message": f"[DRY RUN] Would stop instance {instance_name} (idle for {idle_minutes} minutes)",
            "instance": instance_name,
            "connections": max_connections,
            "idle_minutes": idle_minutes
        }
        print(f"🧪 {result['message']}")
        return json.dumps(result), 200
    
    # Actually stop the instance
    success = stop_sql_instance(project_id, instance_name)
    
    if success:
        result = {
            "status": "stopped",
            "message": f"Successfully stopped instance {instance_name} after {idle_minutes} minutes of inactivity",
            "instance": instance_name,
            "connections": max_connections,
            "idle_minutes": idle_minutes,
            "timestamp": datetime.utcnow().isoformat()
        }
        print(f"🛑 {result['message']}")
        return json.dumps(result), 200
    else:
        result = {
            "status": "error",
            "message": f"Failed to stop instance {instance_name}",
            "instance": instance_name
        }
        print(f"❌ {result['message']}")
        return json.dumps(result), 500


# For testing locally
if __name__ == "__main__":
    class MockRequest:
        pass
    
    print("Testing auto-stop function locally...")
    response, status = auto_stop_idle_sql(MockRequest())
    print(f"\nResponse ({status}):")
    print(response)
