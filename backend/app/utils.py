import io
from fastapi import UploadFile, HTTPException, status
from backend.app.config import settings

async def validate_pdf_resume(file: UploadFile) -> None:
    """
    Validates that the uploaded file is a PDF, under 5MB in size,
    and sniffs the binary header to ensure it matches the PDF magic number (%PDF).
    """
    # 1. Basic extension check (though easily spoofable)
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a .pdf extension"
        )

    # 2. MIME type check
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MIME type must be application/pdf"
        )

    # 3. File size check (Seek to end of SpooledTemporaryFile to find size)
    try:
        # Seek to end
        file.file.seek(0, 2)
        size = file.file.tell()
        # Seek back to start so it can be read later
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file metadata: {str(e)}"
        )

    if size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the 5MB limit (actual size: {size / 1024 / 1024:.2f}MB)"
        )
        
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    # 4. Content sniffing (PDF Magic Number check: %PDF is hex 25 50 44 46)
    try:
        header = await file.read(4)
        await file.seek(0)  # Reset pointer to start for subsequent saving
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sniff file header: {str(e)}"
        )

    if header != b"%PDF":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file. The file content does not start with the PDF magic header."
        )
