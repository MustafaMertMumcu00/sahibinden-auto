import time
import random
import threading
import os
from app.services.car_listing_service import CarListingService
from app.db import get_db_connection

def _discount_worker(app):
    """The background thread logic that runs continuously."""
    discount_rates = [0.05, 0.10, 0.15, 0.20]

    # Establish the application context for the thread
    with app.app_context():
        while True:
            time.sleep(5)
            conn = None
            cur = None
            
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("""
                    SELECT car_id, user_id, price 
                    FROM car_listing 
                    ORDER BY RANDOM() LIMIT 1
                """)
                
                car = cur.fetchone()
                
                cur.close()
                conn.close()
                cur = None
                conn = None
                
                if not car:
                    continue
                    
                car_id, user_id, current_price = car
                
                rate = random.choice(discount_rates)
                new_price = int(int(current_price) * (1 - rate))
                
                listing_service = CarListingService()
                listing_service.apply_discount(car_id, user_id, new_price)
                
            except Exception as e:
                print(f"Generator error: {e}")
            finally:
                if cur:
                    cur.close()
                if conn:
                    conn.close()

def start_discount_generator(app):
    """Safely starts the background thread without duplicating it."""
    # Prevent duplicate threads when Flask's debug reloader (Werkzeug) is active
    if app.debug and os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        return
        
    thread = threading.Thread(target=_discount_worker, args=(app,), daemon=True)
    thread.start()
    print("Background discount generator thread started.")