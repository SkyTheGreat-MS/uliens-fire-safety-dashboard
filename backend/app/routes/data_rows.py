import math
from numbers import Real

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from ..models.schemas import DatasetPage, DatasetRow, StatisticsResponse
from ..services.data_loader import get_dataset, get_dataset_statistics

router = APIRouter()


@router.get("/{dataset_name}", response_model=DatasetPage)
def get_dataset_rows(
    dataset_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    try:
        df = get_dataset(dataset_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Dataset not found") from exc

    rows = df.iloc[skip : skip + limit].to_dict(orient="records")
    items = [
        DatasetRow(
            dataset_name=dataset_name,
            data={
                key: None if pd.isna(value) or (isinstance(value, Real) and not math.isfinite(value)) else value
                for key, value in row.items()
            },
        )
        for row in rows
    ]
    return DatasetPage(items=items, total=len(df), skip=skip, limit=limit, has_more=skip + limit < len(df))


@router.get("/{dataset_name}/statistics", response_model=StatisticsResponse)
def get_statistics(dataset_name: str):
    stats = get_dataset_statistics(dataset_name)
    if stats is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return StatisticsResponse(dataset_name=dataset_name, stats=stats)
