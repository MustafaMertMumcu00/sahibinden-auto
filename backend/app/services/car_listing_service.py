import pika, json
from app.db import get_db_connection

class CarListingService:
    def __init__(self):
        # establish connection when the class is initialized
        self.conn = get_db_connection()

    def get_all_public_listings(self):
        """Fetches all car listings in the database for the public marketplace."""
        cur = self.conn.cursor()
        try:
            cur.execute("""
                SELECT 
                    cl.car_id, 
                    b.brand_name AS brand, 
                    m.model_name AS model, 
                    f.fuel_name AS fuel, 
                    u.user_name AS seller,
                    cl.year, 
                    cl.km, 
                    cl.price, 
                    cl.created_at 
                FROM car_listing cl
                JOIN brand b ON cl.brand_id = b.brand_id
                JOIN model m ON cl.model_id = m.model_id
                JOIN fuel f ON cl.fuel_id = f.fuel_id
                JOIN users u ON cl.user_id = u.user_id
                ORDER BY cl.created_at DESC
            """)
            
            rows = cur.fetchall()
            if not rows:
                return []
                
            columns = [col[0] for col in cur.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            cur.close()
            self.conn.close()

    def get_user_listings(self, user_id):
        """Fetches listings for a specific user, joining brand, model, and fuel names."""
        cur = self.conn.cursor()
        try:
            # using JOIN to get the actual text names instead of just IDs
            cur.execute("""
                SELECT 
                    cl.car_id, 
                    b.brand_name AS brand, 
                    m.model_name AS model, 
                    f.fuel_name AS fuel, 
                    cl.year, 
                    cl.km, 
                    cl.price, 
                    cl.created_at 
                FROM car_listing cl
                JOIN brand b ON cl.brand_id = b.brand_id
                JOIN model m ON cl.model_id = m.model_id
                JOIN fuel f ON cl.fuel_id = f.fuel_id
                WHERE cl.user_id = %s 
                ORDER BY cl.created_at DESC
            """, (user_id,))
            
            rows = cur.fetchall()
            if not rows:
                return []
                
            columns = [col[0] for col in cur.description]
            return [dict(zip(columns, row)) for row in rows]
        finally:
            cur.close()
            self.conn.close()

    def add_listing(self, user_id, listing_data):
        """Inserts a new listing into PostgreSQL tied strictly to the session user_id."""
        cur = self.conn.cursor()
        try:
            cur.execute("""
                INSERT INTO car_listing (brand_id, model_id, fuel_id, user_id, year, km, price)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING car_id, brand_id, model_id, fuel_id, user_id, year, km, price, created_at
            """, (
                listing_data.get("brand_id"),
                listing_data.get("model_id"),
                listing_data.get("fuel_id"),
                user_id,
                listing_data.get("year"),
                listing_data.get("km"),
                listing_data.get("price")
            ))
            
            row = cur.fetchone()
            self.conn.commit()
            
            columns = [col[0] for col in cur.description]
            return dict(zip(columns, row))
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
            self.conn.close()

    def delete_listing(self, car_id, user_id):
        """Deletes a car listing only if it belongs to the session user_id."""
        cur = self.conn.cursor()
        try:
            cur.execute("""
                DELETE FROM car_listing 
                WHERE car_id = %s AND user_id = %s
            """, (car_id, user_id))
            
            self.conn.commit()
            return cur.rowcount > 0  # Returns True if a row was actually deleted
        except Exception as e:
            self.conn.rollback()
            return False
        finally:
            cur.close()
            self.conn.close()

    def apply_discount(self, car_id, user_id, new_price):
        """Applies a discount to a listing and broadcasts the event via RabbitMQ."""
        cur = self.conn.cursor()
        try:
            # Verify ownership and fetch details for the RabbitMQ message
            cur.execute("""
                SELECT cl.price, u.user_name AS seller, b.brand_name AS brand, m.model_name AS model
                FROM car_listing cl
                JOIN users u ON cl.user_id = u.user_id
                JOIN brand b ON cl.brand_id = b.brand_id
                JOIN model m ON cl.model_id = m.model_id
                WHERE cl.car_id = %s AND cl.user_id = %s
            """, (car_id, user_id))
            
            row = cur.fetchone()
            if not row:
                return None  # Car not found or user does not own it

            current_price = row[0]
            seller = row[1]
            brand = row[2]
            model = row[3]

            # Update the prices in the database
            cur.execute("""
                UPDATE car_listing 
                SET old_price = price, price = %s 
                WHERE car_id = %s
            """, (new_price, car_id))
            
            self.conn.commit()

            # Publish the discount event to RabbitMQ
            message = {
                "car_id": car_id,
                "seller": seller,
                "brand": brand,
                "model": model,
                "old_price": int(current_price),
                "new_price": int(new_price)
            }

            # Connect the Flask/Python app to RabbitMQ running in Docker through localhost
            connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
            channel = connection.channel()
            
            channel.exchange_declare(exchange='price_drops', exchange_type='fanout')
            channel.basic_publish(
                exchange='price_drops', 
                routing_key='', 
                body=json.dumps(message)
            )
            connection.close()

            return message
            
        except Exception as e:
            self.conn.rollback()
            raise e
        finally:
            cur.close()
            self.conn.close()