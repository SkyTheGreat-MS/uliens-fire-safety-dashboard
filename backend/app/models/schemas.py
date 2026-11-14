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
    schema: Dict[str, str]  # column name -> type name

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

class StatisticsResponse(BaseModel):
    dataset_name: str
    stats: Dict[str, Dict[str, float]]  # column -> {mean, median, min, max}

