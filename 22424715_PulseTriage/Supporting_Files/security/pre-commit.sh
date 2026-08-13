#!/bin/sh
# Blocks any commit that stages a credential. Recurrence barrier for TD-02.
#
# Enable once per clone:   git config core.hooksPath .githooks
node scripts/scan-secrets.mjs || {
  echo ""
  echo "Commit aborted by the secret scanner."
  echo "Override only if you are certain it is a false positive:  git commit --no-verify"
  exit 1
}
