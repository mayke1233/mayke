"""Keep identity level and reason on the same dimension.

EXACT and HIGH describe an aligned model, so they cannot carry MODEL_CONFLICT.
MODEL_CONFLICT is emitted only for CONFLICT. AMBIGUOUS means the texts did not
contain enough model data. Source blocks are copied through unchanged.
"""

from __future__ import annotations

from identity.generic_product_identity_matcher import (
    IDENTITY_AMBIGUOUS,
    IDENTITY_CONFLICT,
    IDENTITY_EXACT,
    IDENTITY_HIGH,
    REASON_INSUFFICIENT,
    REASON_MODEL_CONFLICT,
    REASON_MODEL_MATCH,
    match_product_identity,
)

SOURCE_COMPETITOR_OR_MARKETPLACE_CDN = "COMPETITOR_OR_MARKETPLACE_CDN"

_SOURCE_BLOCKS = {SOURCE_COMPETITOR_OR_MARKETPLACE_CDN}
_ALIGNED = {IDENTITY_EXACT, IDENTITY_HIGH}


def enforce_identity_reason_consistency(result: dict) -> dict:
    """Drop reasons that contradict the identity level. Leave source blocks alone."""
    identity = result["identityMatch"]
    reasons = [
        reason
        for reason in list(result.get("reasons") or [])
        if reason not in _SOURCE_BLOCKS
    ]
    source_blocks = list(result.get("sourceBlocks") or [])

    if identity in _ALIGNED:
        reasons = [
            reason
            for reason in reasons
            if reason not in {REASON_MODEL_CONFLICT, REASON_INSUFFICIENT}
        ]
        if REASON_MODEL_MATCH not in reasons:
            reasons.insert(0, REASON_MODEL_MATCH)
    elif identity == IDENTITY_CONFLICT:
        reasons = [
            reason
            for reason in reasons
            if reason not in {REASON_MODEL_MATCH, REASON_INSUFFICIENT}
        ]
        if REASON_MODEL_CONFLICT not in reasons:
            reasons.append(REASON_MODEL_CONFLICT)
    elif identity == IDENTITY_AMBIGUOUS:
        reasons = [
            reason
            for reason in reasons
            if reason not in {REASON_MODEL_CONFLICT, REASON_MODEL_MATCH}
        ]
        if REASON_INSUFFICIENT not in reasons:
            reasons.append(REASON_INSUFFICIENT)
    else:
        raise ValueError(f"unknown identityMatch: {identity}")

    consistent = dict(result)
    consistent["reasons"] = reasons
    consistent["sourceBlocks"] = source_blocks
    return consistent


def resolve_identity_match(
    target: str,
    candidate: str,
    source_blocks: list[str] | None = None,
) -> dict:
    """Match with the current comparator, then force reason consistency."""
    matched = match_product_identity(target, candidate)
    matched["sourceBlocks"] = list(source_blocks or [])
    return enforce_identity_reason_consistency(matched)
