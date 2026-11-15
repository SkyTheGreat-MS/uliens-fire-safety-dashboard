from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="1.0.0")

class DatasetInfo(BaseModel):
    name: str
    num_records: int
    columns: List[str]

class DatasetSchema(BaseModel):
    name: str
    column_types: Dict[str, str] = Field(alias="schema")

class RecordBase(BaseModel):
    dataset_name: str = Field(..., description="Name of the dataset (without .csv extension)")
    data: Dict[str, Any] = Field(..., description="Record fields matching the dataset schema")

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    # Partial updates; dataset_name cannot be changed

class RecordResponse(BaseModel):
    id: int
    dataset_name: str
    data: Dict[str, Any]

class DatasetRow(BaseModel):
    dataset_name: str = Field(..., description="Name of the dataset")
    data: Dict[str, Any] = Field(..., description="Row data matching schema")

class DatasetPage(BaseModel):
    items: List[DatasetRow]
    total: int
    skip: int
    limit: int
    has_more: bool

class ColumnStatistics(BaseModel):
    count: int
    missing: int
    mean: float | None
    median: float | None
    min: float | None
    max: float | None

class StatisticsResponse(BaseModel):
    dataset_name: str
    stats: Dict[str, ColumnStatistics]

