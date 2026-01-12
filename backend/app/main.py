# backend/app/main.py

from typing import Union
from fastapi import FastAPI
from fastapi import Depends
from app.services.db import get_connection
from dotenv import load_dotenv
from app.routes import auth
from app.routes import chat
from app.routes import chat_ws, conversation
from app.middlewares.secure_route import verify_jwt_token
from app.routes import contact

app = FastAPI()
load_dotenv()

def get_db():
    conn = get_connection()
    try:
        yield conn
        print("DB connection successful")
    finally:
        conn.close()

@app.get("/test")
def read_root():
    return {"Hello": "World"}

@app.get("/time")
def get_time(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT NOW()")
    time = cursor.fetchone()
    cursor.close()
    return {"time": time}

app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(chat.router, dependencies=[Depends(verify_jwt_token)])
app.include_router(chat_ws.router)
app.include_router(conversation.router)
