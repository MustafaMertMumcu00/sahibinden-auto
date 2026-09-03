import pg8000.dbapi 
from flask import current_app 

def get_db_connection():
    """Establishes a PostgreSQL connection."""
    conn = pg8000.dbapi.connect(
        host=current_app.config.get('DB_HOST'),
        port=int(current_app.config.get('DB_PORT')),
        database=current_app.config.get('DB_NAME'),
        user=current_app.config.get('DB_USER'),
        password=current_app.config.get('DB_PASSWORD')
    )
    return conn

def fetch_as_dict(cursor):
    """Helper function to convert raw tuple results into dictionaries. (this is for readability)"""
    if not cursor.description:
        return []
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]