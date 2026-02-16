#!/bin/bash
# Script to mark all remote-only migrations as reverted

echo "Marking all remote-only migrations as reverted..."

# List of all remote-only migrations that need to be reverted
migrations=(
  "20260216005308" "20260216005555" "20260216005556" "20260216005558"
  "20260216005600" "20260216005616" "20260216005624" "20260216005627"
  "20260216005759" "20260216005804" "20260216005828" "20260216005854"
  "20260216005856" "20260216005857" "20260216005858" "20260216010358"
  "20260216010421" "20260216010423" "20260216010426" "20260216010429"
  "20260216010432" "20260216010434" "20260216010450" "20260216020802"
  "20260216021337" "20260216055644" "20260216060246" "20260216060505"
  "20260216093751" "20260216095008" "20260216095009" "20260216104135"
  "20260216104505" "20260216105121" "20260216105533" "20260216113016"
  "20260216135022" "20260216135120"
)

# Also revert all the old local migrations
old_migrations=(
  "20240101000000" "20240101000008" "20240101000009" "20260212000001"
  "20260213092932" "20260213094007" "20260213094008" "20260213100022"
  "20260213102228" "20260213102248" "20260213132406" "20260213133056"
  "20260213133940" "20260213134830" "20260213161444" "20260213162608"
  "20260213170600" "20260213190310" "20260213200845" "20260213201724"
  "20260213211942" "20260216000001" "20260216000002" "20260216005006"
  "20260216010359" "20260216044052" "20260216083234" "20260216083245"
)

# Mark remote-only migrations as reverted
for migration in "${migrations[@]}"; do
  echo "Reverting $migration..."
  npx supabase@latest migration repair --status reverted "$migration"
done

# Mark old local migrations as reverted
for migration in "${old_migrations[@]}"; do
  echo "Reverting $migration..."
  npx supabase@latest migration repair --status reverted "$migration"
done

# Also mark the unnamed migrations as reverted
echo "Reverting unnamed migrations..."
npx supabase@latest migration repair --status reverted "20260216"

echo ""
echo "✅ Migration history cleanup complete!"
echo "Run: npx supabase migration list"
echo "to verify the migration history."
