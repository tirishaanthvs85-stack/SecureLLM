"""Explicit attack-outcome contract and ASR denominator policy."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Mapping, Sequence


class AttackOutcomeStatus(StrEnum):
    CLASSIFIED = "classified"
    AMBIGUOUS = "ambiguous"
    FAILED = "failed"
    SKIPPED = "skipped"
    NOT_APPLICABLE = "not_applicable"
    UNAVAILABLE = "unavailable"


@dataclass(frozen=True, slots=True)
class AttackOutcomeRecord:
    evaluation_id: str
    attack_family: str
    evaluator_id: str
    evaluator_version: str
    success: bool | None
    status: AttackOutcomeStatus
    reason: str | None = None
    evidence: Mapping[str, object] = field(default_factory=dict)
    provenance: Mapping[str, object] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not all((self.evaluation_id, self.attack_family, self.evaluator_id, self.evaluator_version)):
            raise ValueError("attack outcome requires evaluation, family, evaluator, and version")
        if self.status is AttackOutcomeStatus.CLASSIFIED and self.success is None:
            raise ValueError("classified attack outcomes require true/false success")
        if self.status is not AttackOutcomeStatus.CLASSIFIED and self.success is not None:
            raise ValueError("non-classified attack outcomes must keep success null")


def calculate_asr(records: Sequence[AttackOutcomeRecord], *, denominator_policy: str = "classified_only") -> dict[str, object]:
    if denominator_policy != "classified_only":
        raise ValueError("only classified_only denominator policy is currently implemented")
    classified = [record for record in records if record.status is AttackOutcomeStatus.CLASSIFIED]
    successes = sum(record.success is True for record in classified)
    return {
        "attack_success_rate": successes / len(classified) if classified else None,
        "successes": successes,
        "denominator": len(classified),
        "denominator_policy": denominator_policy,
        "excluded_counts": {
            status.value: sum(record.status is status for record in records)
            for status in AttackOutcomeStatus
            if status is not AttackOutcomeStatus.CLASSIFIED
        },
        "status": "computed" if classified else "insufficient_data",
        "scientifically_validated": False,
    }
