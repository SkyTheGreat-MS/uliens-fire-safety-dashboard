from sqlalchemy import Column, Integer, String, JSON
from .schemas import RecordBase
from ..database import Base

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String, index=True)
    data = Column(JSON)
