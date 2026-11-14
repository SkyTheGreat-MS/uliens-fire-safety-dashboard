from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.schemas import RecordCreate, RecordResponse, RecordUpdate
from ..services.data_service import (
    create_record,
    get_record,
    list_records,
    update_record,
    delete_record,
)
from ..database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
def create(record_in: RecordCreate, db: Session = Depends(get_db)):
    return create_record(db, record_in)

@router.get("/{record_id}", response_model=RecordResponse)
def read(record_id: int, db: Session = Depends(get_db)):
    db_record = get_record(db, record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    return db_record

@router.get("/", response_model=List[RecordResponse])
def list_records_endpoint(
    dataset_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return list_records(db, dataset_name, skip, limit)

@router.put("/{record_id}", response_model=RecordResponse)
def update(record_id: int, record_in: RecordUpdate, db: Session = Depends(get_db)):
    db_record = update_record(db, record_id, record_in)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    return db_record

@router.delete("/{record_id}", response_model=RecordResponse)
def delete(record_id: int, db: Session = Depends(get_db)):
    db_record = delete_record(db, record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    return db_record
