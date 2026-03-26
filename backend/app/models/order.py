import uuid
from sqlalchemy import Column, String, BigInteger, Integer
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, TimestampMixin


class SwapOrder(Base, TimestampMixin):
    __tablename__ = "swap_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    onchain_id = Column(Integer, unique=True, index=True)
    creator = Column(String, nullable=False, index=True)
    from_chain = Column(String, nullable=False)
    to_chain = Column(String, nullable=False)
    from_asset = Column(String, nullable=False)
    to_asset = Column(String, nullable=False)
    from_amount = Column(BigInteger, nullable=False)
    to_amount = Column(BigInteger, nullable=False)
    min_fill_amount = Column(BigInteger, nullable=True)
    filled_amount = Column(BigInteger, default=0)
    expiry = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False, default="open")
    counterparty = Column(String, nullable=True)
