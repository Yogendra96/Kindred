#!/bin/bash

# Fix corrupted files with literal \n instead of newlines

echo "Fixing corrupted TypeScript files..."

fix_file() {
    local file=$1
    echo "Processing: $file"

    # Create backup
    cp "$file" "$file.bak"

    # Replace literal \n with actual newlines using sed
    # This handles the case where \n is written as literal characters
    sed 's/\\n/\
/g' "$file.bak" > "$file"

    echo "  ✓ Fixed $file"
}

# Fix the corrupted files
fix_file "src/hooks/useModernAPM.tsx"
fix_file "src/examples/APMIntegrationExample.tsx"
fix_file "src/services/EnhancedPerformanceService.ts"
fix_file "src/services/ZeroTrustSecurityService.ts"

echo "✅ All files fixed!"
echo "Backup files created with .bak extension"
