#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-backup.sh <backup-file>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "🔄 Restoring Aegis-MCX runtime data from backup..."
echo "Backup file: $BACKUP_FILE"
echo ""

# Create backup of current state before restoring
if [ -d "backend/storage/runtime" ] && [ "$(ls -A backend/storage/runtime)" ]; then
  SAFETY_BACKUP="backend/storage/runtime-before-restore-$(date +%Y%m%d_%H%M%S)"
  echo "Creating safety backup of current state: $SAFETY_BACKUP"
  cp -r backend/storage/runtime "$SAFETY_BACKUP"
fi

# Restore from backup
echo "Restoring runtime storage..."
mkdir -p backend/storage/runtime
tar -xzf "$BACKUP_FILE" -C backend/storage/runtime

echo "✅ Restore completed successfully"
echo ""
echo "Runtime data has been restored from: $BACKUP_FILE"
