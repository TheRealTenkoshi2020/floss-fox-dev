# Verified restore confirmation - design and plan

Inspection: backup import (Merge / Replace, full or older projects-only) already keeps a pre-import copy
(Undo last import) and shows "Restore done" from in-memory results. "applied but NOT saved" could leave a
partial write. Restoring an automatic copy writes raw keys and reloads with no confirmation afterwards.

Design (reuses existing paths, no consent changes, no migration):
- New `restore-verify.js` (pure, Node testable): verifyKeys(expected, get), writeKeys(keys, set, remove),
  importMessage(result), copyMessage(result).
- Import: take an in-memory copy of the affected keys (`snapshot()`) right before any write. After saving,
  read back projects, threads (full backups) and restored preferences and compare to exactly what was meant
  to be saved. Only then show "Restore checked and saved" with real counts and totals, in the restore panel
  (stays visible, no reload). Journal re-base only after a verified save.
- If a save fails or the read-back differs: write the in-memory copy back, read it back too, then reload so
  the screen matches storage and show (via sessionStorage, once) either "nothing was changed" (verified) or a
  clear "could not confirm, use Undo last import" warning. Never claims success.
- Automatic copy restore: after writing, read every key back; on mismatch write the previous values back
  (existing pattern) and say so. On success record {at, from, sig} in its own meta key; after the reload the
  Automatic copies box shows "Restored and checked" with counts only if current storage still matches sig.
- Limits: verification is a same-browser read-back, not a guarantee against later browser clean-up; the
  allocations rollback path is unchanged.

Tests first: tests/restore_verify_unit.cjs, tests/restore_verify_e2e.py.
