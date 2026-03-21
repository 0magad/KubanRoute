"""
BusinessService: handles business place submissions.
"""

import json
import os
import uuid
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory storage for business submissions
_submissions: list[dict] = []

# Path for persistent storage
_SUBMISSIONS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'submissions.json')


def save_submission(form_data: dict) -> dict:
    """Save a business submission."""
    submission = {
        "id": str(uuid.uuid4()),
        "status": "pending",
        "submitted_at": datetime.now().isoformat(),
        "raw_form_data": form_data,
        "moderator_notes": "",
    }

    _submissions.append(submission)

    # Persist to file
    try:
        _save_to_file()
    except Exception as e:
        logger.error(f"Failed to save submission to file: {e}")

    logger.info(f"New business submission: {form_data.get('name', 'Unknown')}")
    return submission


def get_submissions(status: Optional[str] = None) -> list[dict]:
    """Get all submissions, optionally filtered by status."""
    _load_from_file()
    if status:
        return [s for s in _submissions if s["status"] == status]
    return _submissions


def _save_to_file():
    """Persist submissions to JSON file."""
    os.makedirs(os.path.dirname(_SUBMISSIONS_PATH), exist_ok=True)
    with open(_SUBMISSIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(_submissions, f, ensure_ascii=False, indent=2)


def _load_from_file():
    """Load submissions from JSON file."""
    global _submissions
    if _submissions:
        return
    if os.path.exists(_SUBMISSIONS_PATH):
        try:
            with open(_SUBMISSIONS_PATH, 'r', encoding='utf-8') as f:
                _submissions = json.load(f)
        except Exception:
            _submissions = []
