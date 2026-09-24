"""Current product identity comparison.

Model words decide the level. A series phrase such as "Série 8" restates S8;
it is not a second model. Brand absence on the candidate keeps the level at
HIGH when the model itself matches. This module does not assign source blocks.
"""

from __future__ import annotations

import re
import unicodedata

IDENTITY_EXACT = "EXACT"
IDENTITY_HIGH = "HIGH"
IDENTITY_CONFLICT = "CONFLICT"
IDENTITY_AMBIGUOUS = "AMBIGUOUS"

REASON_MODEL_CONFLICT = "MODEL_CONFLICT"
REASON_MODEL_MATCH = "MODEL_MATCH"
REASON_INSUFFICIENT = "INSUFFICIENT_IDENTITY_DATA"

_DISTINGUISHERS = ("ultra", "pro", "max", "plus", "lite", "mini", "se")
_NOISE = {
    "relogio",
    "inteligente",
    "smartwatch",
    "smart",
    "watch",
    "serie",
    "series",
    "nfc",
    "caixa",
    "laranja",
    "com",
    "de",
    "para",
    "original",
    "compativel",
    "bluetooth",
    "gps",
}


def _normalize(text: str) -> str:
    folded = unicodedata.normalize("NFD", text)
    without_marks = "".join(
        char for char in folded if unicodedata.category(char) != "Mn"
    )
    lowered = without_marks.lower().replace("série", "serie")
    lowered = lowered.replace("series", "serie")
    cleaned = re.sub(r"[^a-z0-9]+", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def _model_signature(text: str) -> tuple[str, frozenset[str]] | None:
    """Return (series number, distinguisher set) or None when no model code exists."""
    normalized = _normalize(text)
    match = re.search(r"\bs\s*(\d{1,2})\b", normalized)
    if match is None:
        return None

    number = match.group(1)
    distinguishers: list[str] = []
    for word in normalized[match.end() :].split():
        if word in _DISTINGUISHERS:
            distinguishers.append(word)
            continue
        if word in _NOISE or (word.isdigit() and len(word) == 4):
            continue
        if word.isdigit() and word == number:
            continue
        break

    series_numbers = re.findall(r"\bserie\s+(\d{1,2})\b", normalized)
    if any(series != number for series in series_numbers):
        return (f"serie-conflict-{number}", frozenset(distinguishers))

    return (number, frozenset(distinguishers))


def _brand_token(target: str, signature_number: str) -> str | None:
    normalized = _normalize(target)
    tokens = [
        token
        for token in normalized.split()
        if token not in _NOISE
        and token not in _DISTINGUISHERS
        and token != f"s{signature_number}"
        and not token.isdigit()
    ]
    if not tokens:
        return None
    return tokens[0]


def match_product_identity(target: str, candidate: str) -> dict:
    """Compare target and candidate model identity. Source is not decided here."""
    target_signature = _model_signature(target)
    candidate_signature = _model_signature(candidate)

    if target_signature is None or candidate_signature is None:
        return {
            "identityMatch": IDENTITY_AMBIGUOUS,
            "reasons": [REASON_INSUFFICIENT],
            "found": None,
        }

    found = "s" + candidate_signature[0]
    if candidate_signature[1]:
        found = found + " " + " ".join(
            token
            for token in ("ultra", "pro", "max", "plus", "lite", "mini", "se")
            if token in candidate_signature[1]
        )

    if target_signature != candidate_signature:
        return {
            "identityMatch": IDENTITY_CONFLICT,
            "reasons": [REASON_MODEL_CONFLICT],
            "found": found,
        }

    brand = _brand_token(target, target_signature[0])
    candidate_normalized = _normalize(candidate)
    brand_on_candidate = bool(brand) and brand in candidate_normalized.split()
    level = IDENTITY_EXACT if brand_on_candidate or not brand else IDENTITY_HIGH
    return {
        "identityMatch": level,
        "reasons": [REASON_MODEL_MATCH],
        "found": found,
    }
