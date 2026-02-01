FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone the repository
RUN git clone --depth=1 https://github.com/yourusername/perundhu.git . 2>/dev/null || echo "Repo clone info"

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy data files
COPY data/tamil_nadu_locations_enhanced.json data/
COPY data/consolidated_buses.json data/

# Set environment variables for Cloud SQL connection
ENV CLOUDSQL_INSTANCE="astute-strategy-406601:asia-south1:perundhu-preprod-mysql"
ENV DB_HOST="/cloudsql/astute-strategy-406601:asia-south1:perundhu-preprod-mysql"
ENV DB_PORT="3306"
ENV DB_NAME="perundhu"

# Run the data loader
CMD ["python", "scripts/unified_data_loader.py", "--mode", "full", "--environment", "local", "--locations", "data/tamil_nadu_locations_enhanced.json", "--buses", "data/consolidated_buses.json", "--operator", "TNSTC"]
