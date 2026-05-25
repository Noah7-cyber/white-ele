#!/bin/bash
# Setup test database
# This script drops and recreates the test database

DB_NAME="whitepenguin_backend_test"
DB_USER="root"
DB_PASSWORD=""

echo "Dropping and recreating test database: $DB_NAME"

# Drop database if exists
mysql -u"$DB_USER" -e "DROP DATABASE IF EXISTS $DB_NAME;"

# Create fresh database
mysql -u"$DB_USER" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "Test database $DB_NAME created successfully"


