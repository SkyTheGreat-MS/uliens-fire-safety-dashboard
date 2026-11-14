from fastapi import APIRouter, HTTPException, Query
from typing import List

from ..models.schemas import DatasetRow, DatasetInfo, StatisticsResponse
from ..services.data_loader import (
    get_dataset,
    get_dataset_schema,
    get_dataset_slice,
    get_dataset_statistics,
    list_datasets,
)

router = APIRouter()

@router.get("/{dataset_name}", response_model=dict)
async def get_dataset_rows(
    dataset_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Return a paginated slice of the CSV dataset.

    - `skip` offset from the start of the file.
    - `limit` maximum items per page (capped at 1000).
    - Response includes `items`, `total`, `skip`, `limit`, `has_more`.
    """
    df = get_dataset(dataset_name)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    total = len(df)
    slice_df = get_dataset_slice(dataset_name, skip=skip, limit=limit)
    items = [
        DatasetRow(dataset_name=dataset_name, data=row.to_dict())
        for _, row in slice_df.iterrows()
    ]
    has_more = (skip + limit) < total
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": has_more,
    }

@router.get("/{dataset_name}/statistics", response_model=StatisticsResponse)
async def get_statistics(dataset_name: str):
    """Calculate basic statistics for numeric columns of the dataset.
    Returns counts of valid and missing values along with mean, median, min, max.
    """
    stats = get_dataset_statistics(dataset_name)
    if stats is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return StatisticsResponse(dataset_name=dataset_name, stats=stats)
