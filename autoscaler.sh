#!/bin/bash

# Configurable environment variables (with defaults)
MIN_INSTANCES=${MIN_INSTANCES:-2}
MAX_INSTANCES=${MAX_INSTANCES:-10}
CPU_THRESHOLD=${CPU_THRESHOLD:-70}
MEMORY_THRESHOLD=${MEMORY_THRESHOLD:-70}

# Services to scale
SERVICE_NAMES=("services" "nginx")

# Function to scale the service
scale_service() {
    local service_name=$1
    local current_replicas=$2
    local avg_cpu=$3
    local avg_mem=$4

    echo "Current CPU for $service_name: ${avg_cpu}%, Memory: ${avg_mem}%, Replicas: $current_replicas"

    if (( $(echo "$avg_cpu > $CPU_THRESHOLD" | bc -l) )) || (( $(echo "$avg_mem > $MEMORY_THRESHOLD" | bc -l) )); then
        if [ "$current_replicas" -lt "$MAX_INSTANCES" ]; then
            new_replicas=$((current_replicas + 1))
            echo "Scaling $service_name up to $new_replicas replicas"
            podman-compose up -d --scale $service_name=$new_replicas
        fi
    elif (( $(echo "$avg_cpu < $CPU_THRESHOLD / 2" | bc -l) )) && (( $(echo "$avg_mem < $MEMORY_THRESHOLD / 2" | bc -l) )); then
        if [ "$current_replicas" -gt "$MIN_INSTANCES" ]; then
            new_replicas=$((current_replicas - 1))
            echo "Scaling $service_name down to $new_replicas replicas"
            podman-compose up -d --scale $service_name=$new_replicas
        fi
    fi
}

while true; do
    for service_name in "${SERVICE_NAMES[@]}"; do
        # Get the current number of replicas for the service
        current_replicas=$(podman ps --format '{{.Names}}' | grep -c "$service_name")

        # Use podman stats for a single reading
        stats=$(podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}" | grep "$service_name")

        # Extract CPU and Memory percentages
        avg_cpu=$(echo "$stats" | awk '{sum+=$2} END {print (NR>0) ? sum/NR : 0}' | sed 's/%//')
        avg_mem=$(echo "$stats" | awk '{sum+=$3} END {print (NR>0) ? sum/NR : 0}' | sed 's/%//')

        # Scale the service based on resource usage
        scale_service $service_name $current_replicas $avg_cpu $avg_mem
    done

    # Sleep for 60 seconds before the next check
    sleep 60
done