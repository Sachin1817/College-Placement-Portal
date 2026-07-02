import uvicorn
import os

if __name__ == "__main__":
    # Ensure database is referenced from correct cwd or env vars
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
