import os, shutil, uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from PIL import Image as PilImage

from app.core.dependencies import LandlordOrAgentUser, DB
from app.core.exceptions import AppError
from app.models.property import Property, PropertyImage
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


@router.post("/properties/{property_id}/images", status_code=201)
async def upload_property_images(
    property_id: uuid.UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
    files: list[UploadFile] = File(...),
    captions: list[str] = Form(default=[]),
):
    prop = await db.scalar(
        select(Property)
        .options(selectinload(Property.images))
        .where(Property.id == property_id, Property.deleted_at.is_(None))
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if prop.owner_id != current_user.id and prop.agent_id != current_user.id and current_user.role != "admin":
        raise AppError.PROPERTY_NOT_OWNER

    current_count = len(prop.images)
    if current_count + len(files) > settings.MAX_IMAGES_PER_PROPERTY:
        raise AppError.MAX_IMAGES_EXCEEDED

    upload_dir = Path(settings.UPLOAD_DIR) / "properties" / str(property_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    added = []
    for idx, file in enumerate(files):
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(400, f"File '{file.filename}' must be JPEG, PNG, or WebP")

        content = await file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(400, f"File '{file.filename}' exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit")

        ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        filepath = upload_dir / filename

        with open(filepath, "wb") as f:
            f.write(content)

        try:
            with PilImage.open(filepath) as img:
                w, h = img.size
                if w > 1200:
                    new_h = int(h * 1200 / w)
                    img = img.resize((1200, new_h), PilImage.LANCZOS)
                    img.save(filepath, optimize=True, quality=85)
                    w, h = 1200, new_h
        except Exception:
            w, h = None, None

        storage_key = f"properties/{property_id}/{filename}"
        url = f"/uploads/{storage_key}"
        is_primary = (current_count == 0 and idx == 0)

        caption = captions[idx] if idx < len(captions) else None

        image = PropertyImage(
            property_id=property_id,
            url=url,
            storage_key=storage_key,
            caption=caption,
            is_primary=is_primary,
            sort_order=current_count + idx,
            width=w, height=h,
            size_bytes=len(content),
        )
        db.add(image)
        added.append({"url": url, "is_primary": is_primary})

    await db.flush()
    return {"uploaded": len(added), "images": added}


@router.delete("/properties/{property_id}/images/{image_id}", status_code=204)
async def delete_image(
    property_id: uuid.UUID,
    image_id: uuid.UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(select(Property).where(Property.id == property_id))
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if prop.owner_id != current_user.id and prop.agent_id != current_user.id and current_user.role != "admin":
        raise AppError.PROPERTY_NOT_OWNER

    image = await db.scalar(
        select(PropertyImage).where(
            PropertyImage.id == image_id, PropertyImage.property_id == property_id
        )
    )
    if not image:
        raise AppError.NOT_FOUND

    if image.storage_key:
        filepath = Path(settings.UPLOAD_DIR) / image.storage_key
        if filepath.exists():
            filepath.unlink()

    await db.delete(image)


@router.put("/properties/{property_id}/images/{image_id}/primary", status_code=200)
async def set_primary_image(
    property_id: uuid.UUID,
    image_id: uuid.UUID,
    current_user: LandlordOrAgentUser,
    db: DB,
):
    prop = await db.scalar(
        select(Property).options(selectinload(Property.images))
        .where(Property.id == property_id)
    )
    if not prop:
        raise AppError.PROPERTY_NOT_FOUND
    if prop.owner_id != current_user.id and current_user.role != "admin":
        raise AppError.PROPERTY_NOT_OWNER

    for img in prop.images:
        img.is_primary = img.id == image_id

    return {"message": "Primary image updated"}
