#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
if [ "$1" = "backend" ]; then
    echo "Waiting for PostgreSQL..."
    while ! pg_isready -h postgres -p 5432 -U postgres; do
        sleep 1
    done
    echo "PostgreSQL is ready!"
    
    # Set environment for PostgreSQL usage
    export USE_POSTGRES=true
    
    # Start backend
    exec npm run dev
elif [ "$1" = "frontend" ]; then
    # Start frontend
    exec npm run dev:frontend
else
    exec "$@"
fi