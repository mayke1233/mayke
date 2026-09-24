"""Identity match reason consistency."""

from identity.reason_consistency import (
    SOURCE_COMPETITOR_OR_MARKETPLACE_CDN,
    enforce_identity_reason_consistency,
    resolve_identity_match,
)

__all__ = [
    "SOURCE_COMPETITOR_OR_MARKETPLACE_CDN",
    "enforce_identity_reason_consistency",
    "resolve_identity_match",
]
