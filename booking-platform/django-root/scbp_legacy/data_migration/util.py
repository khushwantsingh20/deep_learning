from typing import Optional


def strip(s: Optional[str], default_value="") -> Optional[str]:
    if s is None:
        return default_value
    if not hasattr(s, "strip"):
        return str(s)
    return s.strip()


def choose_first(values):
    """
    >>> choose_first([])
    >>> choose_first(["test   ", "one"])
    'test'
    >>> choose_first(["", "Two"])
    'Two'
    """
    try:
        return next(iter(filter(bool, map(strip, values))))
    except StopIteration:
        return None
