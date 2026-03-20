#!/bin/bash
set -e

echo "📦 Creating backup of Aegis-MCX runtime data..."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aegis-backup-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

# Backup runtime storage
echo "Backing up runtime storage..."
tar -czf "$BACKUP_FILE" \
  -C backend/storage/runtime \
  . \
  2>/dev/null || echo "Warning: Some files may not exist yet"

# Backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "✅ Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore-backup.sh $BACKUP_FILE"
