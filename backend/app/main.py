# backend/app/main.py

from typing import Union
from fastapi import FastAPI
from fastapi import Depends
from app.services.db import get_connection
from dotenv import load_dotenv
from app.routes import auth, match_contacts

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
app.include_router(match_contacts.router)

