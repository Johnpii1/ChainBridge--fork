import uuid
from sqlalchemy import Column, String, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, TimestampMixin


class CrossChainSwap(Base, TimestampMixin):
    __tablename__ = "cross_chain_swaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    onchain_id = Column(String, unique=True, index=True)
    stellar_htlc_id = Column(String, nullable=True)
    other_chain = Column(String, nullable=False)
    other_chain_tx = Column(String, nullable=True)
    stellar_party = Column(String, nullable=False)
    other_party = Column(String, nullable=False)
    state = Column(String, nullable=False, default="initiated")
