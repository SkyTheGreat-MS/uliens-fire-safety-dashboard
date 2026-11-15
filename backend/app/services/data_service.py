from sqlalchemy.orm import Session
from ..models.orm import Record
from ..models.schemas import RecordCreate, RecordUpdate

def get_db_session(db_engine):
    from ..database import SessionLocal
    return SessionLocal()

def create_record(db: Session, record_in: RecordCreate):
    db_record = Record(dataset_name=record_in.dataset_name, data=record_in.data)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def get_record(db: Session, record_id: int):
    return db.query(Record).filter(Record.id == record_id).first()

def list_records(db: Session, dataset_name: str | None = None, skip: int = 0, limit: int = 100):
    query = db.query(Record)
    if dataset_name:
        query = query.filter(Record.dataset_name == dataset_name)
    return query.offset(skip).limit(limit).all()

def update_record(db: Session, record_id: int, record_in: RecordUpdate):
    db_record = get_record(db, record_id)
    if not db_record:
        return None
    if record_in.data is not None:
        db_record.data = record_in.data
    db.commit()
    db.refresh(db_record)
    return db_record

def delete_record(db: Session, record_id: int):
    db_record = get_record(db, record_id)
    if not db_record:
        return None
    db.delete(db_record)
    db.commit()
    return db_record
