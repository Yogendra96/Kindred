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

# Check if services need fixing
if grep -q '\\n' src/services/EnhancedPerformanceService.ts 2>/dev/null; then
    fix_file "src/services/EnhancedPerformanceService.ts"
fi

if grep -q '\\n' src/services/ZeroTrustSecurityService.ts 2>/dev/null; then
    fix_file "src/services/ZeroTrustSecurityService.ts"
fi

echo "✅ All files fixed!"
echo "Backup files created with .bak extension"
