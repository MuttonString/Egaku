from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from src.apis import router

app = FastAPI()
app.include_router(router)
app.mount("/files", StaticFiles(directory='uploads'), name="files")