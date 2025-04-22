from app import db, app
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE biller ADD COLUMN web TEXT;'))
        print("Added 'web' column to 'biller' table.")
    except Exception as e:
        print(f"Error (maybe column already exists): {e}")
