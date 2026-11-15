from fastapi import APIRouter, HTTPException
from typing import List

from ..models.schemas import DatasetSchema, DatasetInfo
from ..services.data_loader import get_dataset_schema, list_datasets

router = APIRouter()

@router.get("/", response_model=List[DatasetInfo])
async def list_available_datasets():
    """Return a list of available datasets with basic info."""
    return list_datasets()

@router.get("/{dataset_name}/schema", response_model=DatasetSchema)
async def get_schema(dataset_name: str):
    """Return the column‑type schema for the specified dataset."""
    schema = get_dataset_schema(dataset_name)
    if schema is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return DatasetSchema(name=dataset_name, schema=schema)
