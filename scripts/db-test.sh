#!/usr/bin/env bash
# Build the schema from supabase/migrations in an EMPTY Postgres and run the SQL tests.
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres scripts/db-test.sh
# CI runs this against a throwaway Postgres container. Never point it at the real Supabase database.
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to an empty test database}"
cd "$(dirname "$0")/.."
run() { psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 "$@"; }

run -f supabase/tests/auth_mock.sql
for f in supabase/migrations/*.sql; do
  case "$f" in *storage*) continue ;; esac # needs Supabase's storage schema
  run -f "$f"
done
# Types first (from the clean schema), then the tests (which add data).
if [[ "${1:-}" == "--types" ]]; then
  PG_META_DB_URL="$DATABASE_URL" PG_META_GENERATE_TYPES=typescript PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS=public \
    PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS=true \
    node node_modules/@supabase/postgres-meta/dist/server/server.js 2>/dev/null > src/lib/supabase/database.types.ts
  echo "Wrote src/lib/supabase/database.types.ts"
fi
run -f supabase/tests/app_test.sql 2>&1 | sed -n 's/^.*NOTICE:  //p; /ERROR/p'
exit "${PIPESTATUS[0]}"
