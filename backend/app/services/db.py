# backend/app/services/db.py

import os
import psycopg2

# DB_HOST = os.getenv("SUPABASE_DB_HOST")
# DB_PORT = os.getenv("SUPABASE_DB_PORT")
# DB_NAME = os.getenv("SUPABASE_DB_NAME")
# DB_USER = os.getenv("SUPABASE_DB_USER")
# DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    # return psycopg2.connect(
    #     host=DB_HOST,
    #     port=DB_PORT,
    #     dbname=DB_NAME,
    #     user=DB_USER,
    #     password=DB_PASSWORD,
    #     sslmode="require", 
    # )
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    
    return psycopg2.connect(DATABASE_URL)