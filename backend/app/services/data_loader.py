from functools import lru_cache
import math
from pathlib import Path

import pandas as pd

from ..config import DATA_DIR


def dataset_files() -> dict[str, Path]:
    return {path.stem: path for path in sorted(DATA_DIR.glob("*.csv")) if path.is_file()}


@lru_cache
def get_dataset(dataset_name: str) -> pd.DataFrame:
    path = dataset_files().get(dataset_name)
    if path is None:
        raise FileNotFoundError(f"Unknown dataset: {dataset_name}")
    return pd.read_csv(path)


def list_datasets() -> list[dict]:
    datasets = []
    for name in dataset_files():
        df = get_dataset(name)
        datasets.append({"name": name, "num_records": len(df), "columns": df.columns.tolist()})
    return datasets


def get_dataset_schema(dataset_name: str) -> dict[str, str] | None:
    try:
        df = get_dataset(dataset_name)
    except FileNotFoundError:
        return None
    return {column: str(dtype) for column, dtype in df.dtypes.items()}


def json_number(value: float) -> float | None:
    return float(value) if math.isfinite(value) else None


def get_dataset_statistics(dataset_name: str) -> dict | None:
    try:
        df = get_dataset(dataset_name)
    except FileNotFoundError:
        return None

    stats = {}
    for col, series in df.select_dtypes(include=["number"]).items():
        series = series.replace([float("inf"), float("-inf")], float("nan"))
        stats[col] = {
            "count": int(series.count()),
            "missing": int(series.isna().sum()),
            "mean": json_number(series.mean()),
            "median": json_number(series.median()),
            "min": json_number(series.min()),
            "max": json_number(series.max()),
        }
    return stats
