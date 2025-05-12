from fastapi import FastAPI
from src.apis import router

app = FastAPI()
app.include_router(router)