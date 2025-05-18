from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.apis import router
import os

app = FastAPI()
app.include_router(router)
if not os.path.exists('uploads'):
    os.makedirs('uploads')
app.mount("/files", StaticFiles(directory='uploads'), name="files")