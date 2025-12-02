from fastapi import APIRouter, HTTPException
from typing import List
from schemas.item import Item, ItemCreate

router = APIRouter(
    prefix="/items",
    tags=["items"],
    responses={404: {"description": "Not found"}},
)

# In-memory "database" for demonstration purposes
db: List[Item] = []
next_id = 1


@router.post("/", response_model=Item)
def create_item(item: ItemCreate):
    global next_id
    db_item = Item(id=next_id, **item.model_dump())
    db.append(db_item)
    next_id += 1
    return db_item


@router.get("/", response_model=List[Item])
def read_items():
    return db


@router.get("/{item_id}", response_model=Item)
def read_item(item_id: int):
    for item in db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")


@router.put("/{item_id}", response_model=Item)
def update_item(item_id: int, item: ItemCreate):
    for idx, db_item in enumerate(db):
        if db_item.id == item_id:
            updated_item = Item(id=item_id, **item.model_dump())
            db[idx] = updated_item
            return updated_item
    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("/{item_id}")
def delete_item(item_id: int):
    global db
    initial_len = len(db)
    db = [item for item in db if item.id != item_id]
    if len(db) == initial_len:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}
