from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: T
    message: Optional[str] = None
    meta: Optional[dict] = None

class PaginatedResponse(APIResponse[list]):
    def __init__(self, items: list, total: int, skip: int, limit: int, message: Optional[str] = None):
        super().__init__(
            data=items,
            meta={"total": total, "skip": skip, "limit": limit},
            message=message
        )
