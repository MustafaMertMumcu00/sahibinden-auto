from app.db import get_db_connection

class CatalogService:
    def __init__(self):
        self.conn = get_db_connection()

    def get_all_brands(self):
        """Fetches all car brands ordered alphabetically."""
        cur = self.conn.cursor()
        try:
            cur.execute("SELECT brand_id, brand_name FROM brand ORDER BY brand_name")
            rows = cur.fetchall()
            columns = [col[0] for col in cur.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            cur.close()
            self.conn.close()

    def get_models_by_brand(self, brand_id):
        """Fetches models that belong to a specific brand."""
        cur = self.conn.cursor()
        try:
            cur.execute(
                "SELECT model_id, model_name FROM model WHERE brand_id = %s ORDER BY model_name", 
                (brand_id,)
            )
            rows = cur.fetchall()
            columns = [col[0] for col in cur.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            cur.close()
            self.conn.close()

    def get_all_fuels(self):
        """Fetches all fuel types."""
        cur = self.conn.cursor()
        try:
            cur.execute("SELECT fuel_id, fuel_name FROM fuel ORDER BY fuel_name")
            rows = cur.fetchall()
            columns = [col[0] for col in cur.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            cur.close()
            self.conn.close()