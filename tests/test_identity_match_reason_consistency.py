"""Identity level and reason stay consistent. Source blocks stay separate."""

from identity.generic_product_identity_matcher import (
    IDENTITY_AMBIGUOUS,
    IDENTITY_CONFLICT,
    IDENTITY_EXACT,
    IDENTITY_HIGH,
    REASON_INSUFFICIENT,
    REASON_MODEL_CONFLICT,
    REASON_MODEL_MATCH,
)
from identity.reason_consistency import (
    SOURCE_COMPETITOR_OR_MARKETPLACE_CDN,
    enforce_identity_reason_consistency,
    resolve_identity_match,
)

CANDIDATE_SERIES = "S8 Pro Max Série 8 NFC 2023"
CANDIDATE_PRODUCTION = (
    "Relógio Inteligente Smartwatch S8 Pro Max Série 8 NFC 2023 Caixa Laranja"
)


def test_s8_pro_max_with_series_phrase_is_high_or_exact_without_model_conflict():
    result = resolve_identity_match("Khostar S8 Pro Max", CANDIDATE_SERIES)

    assert result["identityMatch"] in {IDENTITY_HIGH, IDENTITY_EXACT}
    assert REASON_MODEL_CONFLICT not in result["reasons"]
    assert result["found"] == "s8 pro max"


def test_production_listing_does_not_pair_high_with_model_conflict():
    result = resolve_identity_match("Khostar S8 Pro Max", CANDIDATE_PRODUCTION)

    assert result["identityMatch"] == IDENTITY_HIGH
    assert result["reasons"] == [REASON_MODEL_MATCH]
    assert REASON_MODEL_CONFLICT not in result["reasons"]
    assert result["found"] == "s8 pro max"


def test_ultra_pro_max_is_model_conflict():
    result = resolve_identity_match("Khostar S8 Ultra Pro Max", CANDIDATE_SERIES)

    assert result["identityMatch"] == IDENTITY_CONFLICT
    assert REASON_MODEL_CONFLICT in result["reasons"]
    assert REASON_MODEL_MATCH not in result["reasons"]


def test_ambiguous_uses_insufficient_data_reason():
    result = resolve_identity_match("Relógio", "Caixa Laranja")

    assert result["identityMatch"] == IDENTITY_AMBIGUOUS
    assert result["reasons"] == [REASON_INSUFFICIENT]
    assert REASON_MODEL_CONFLICT not in result["reasons"]


def test_high_can_keep_competitor_or_marketplace_cdn_source_block():
    result = resolve_identity_match(
        "Khostar S8 Pro Max",
        CANDIDATE_PRODUCTION,
        source_blocks=[SOURCE_COMPETITOR_OR_MARKETPLACE_CDN],
    )

    assert result["identityMatch"] == IDENTITY_HIGH
    assert REASON_MODEL_CONFLICT not in result["reasons"]
    assert SOURCE_COMPETITOR_OR_MARKETPLACE_CDN in result["sourceBlocks"]
    assert SOURCE_COMPETITOR_OR_MARKETPLACE_CDN not in result["reasons"]


def test_consistency_strips_model_conflict_from_aligned_levels():
    fixed = enforce_identity_reason_consistency(
        {
            "identityMatch": IDENTITY_HIGH,
            "reasons": [REASON_MODEL_CONFLICT],
            "found": "s8 pro max",
            "sourceBlocks": [SOURCE_COMPETITOR_OR_MARKETPLACE_CDN],
        }
    )

    assert fixed["identityMatch"] == IDENTITY_HIGH
    assert fixed["reasons"] == [REASON_MODEL_MATCH]
    assert fixed["sourceBlocks"] == [SOURCE_COMPETITOR_OR_MARKETPLACE_CDN]


def test_consistency_requires_model_conflict_only_on_conflict_level():
    fixed = enforce_identity_reason_consistency(
        {
            "identityMatch": IDENTITY_CONFLICT,
            "reasons": [REASON_MODEL_MATCH],
            "found": "s8 pro max",
            "sourceBlocks": [],
        }
    )

    assert fixed["reasons"] == [REASON_MODEL_CONFLICT]
