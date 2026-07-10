"""
Image upload service — routes to catbox.moe (default, free, no API key)
or postimg.cc (requires POSTIMG_API_KEY env var).
"""
import os
import base64
import mimetypes
import httpx
from fastapi import UploadFile, HTTPException
from typing import Optional

PROVIDER = os.getenv("IMAGE_UPLOAD_PROVIDER", "catbox").lower()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/heic", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _validate(file: UploadFile):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Allowed: jpg, png, heic, webp")
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large: {file.size} bytes. Max: {MAX_FILE_SIZE} bytes")


async def _upload_catbox(file: UploadFile) -> str:
    """Upload to catbox.moe — free, anonymous, no API key needed."""
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    ext = (file.filename or "upload.jpg").rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    filename = f"upload.{ext}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://catbox.moe/user/api.php",
            data={"reqtype": "fileupload", "userhash": ""},
            files={"fileToUpload": (filename, file_bytes, file.content_type or "image/jpeg")},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Upload provider returned {resp.status_code}")

    url = resp.text.strip()
    if not url.startswith("https://"):
        raise HTTPException(status_code=502, detail=f"Upload failed: {url[:200]}")

    return url


async def _upload_postimg(file: UploadFile) -> str:
    """Upload to postimg.cc — requires POSTIMG_API_KEY env var (get from postimages.org/login/api)."""
    api_key = os.getenv("POSTIMG_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="POSTIMG_API_KEY not configured. Set it in Railway env or use catbox provider.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    b64 = base64.b64encode(file_bytes).decode()
    ext = (file.filename or "upload.jpg").rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    name = (file.filename or "upload").rsplit(".", 1)[0] if "." in (file.filename or "") else "upload"

    form_data = {
        "key": api_key,
        "gallery": "unlockpro",
        "o": "2b819584285c102318568238c7d4a4c7",
        "m": "59c2ad4b46b0c1e12d5703302bff0120",
        "version": "1.0.1",
        "portable": "1",
        "name": name,
        "type": ext,
        "image": b64,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.postimage.org/1/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Postimg returned {resp.status_code}")

    import re
    page_match = re.search(r"<page>(https://postimg\.cc/\w+)</page>", resp.text)
    if not page_match:
        raise HTTPException(status_code=502, detail="Failed to parse postimg response")

    page_url = page_match.group(1)

    # Fetch the page to extract the direct download URL
    async with httpx.AsyncClient(timeout=30.0) as client:
        page_resp = await client.get(page_url, headers={"User-Agent": "Mozilla/5.0"})

    url_match = re.search(r"(https://i\.postimg\.cc/\w+/[^\"'\s]+\?dl=1)", page_resp.text)
    if not url_match:
        raise HTTPException(status_code=502, detail="Failed to extract image URL from postimg page")

    return url_match.group(1)


async def upload_image(file: UploadFile) -> str:
    """Validate and upload an image. Returns the public URL."""
    _validate(file)
    if PROVIDER == "postimg":
        return await _upload_postimg(file)
    return await _upload_catbox(file)
