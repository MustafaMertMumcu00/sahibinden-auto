import logging
from app.db import get_db_connection

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.conn = get_db_connection()

    def initialize_tables(self):
        """Executes raw SQL."""
        cur = self.conn.cursor()
        try:
            # Create Tables (using IF NOT EXISTS to prevent overwriting data)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS brand (
                    brand_id SERIAL PRIMARY KEY,
                    brand_name VARCHAR(50) NOT NULL
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS model (
                    model_id SERIAL PRIMARY KEY,
                    brand_id INTEGER NOT NULL REFERENCES brand(brand_id) ON DELETE CASCADE,
                    model_name VARCHAR(50) NOT NULL
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fuel (
                    fuel_id SERIAL PRIMARY KEY,
                    fuel_name VARCHAR(50) NOT NULL
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id SERIAL PRIMARY KEY,
                    user_name VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS car_listing (
                    car_id SERIAL PRIMARY KEY,
                    brand_id INTEGER NOT NULL REFERENCES brand(brand_id),
                    model_id INTEGER NOT NULL REFERENCES model(model_id),
                    fuel_id INTEGER NOT NULL REFERENCES fuel(fuel_id),
                    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    year INTEGER NOT NULL,
                    km INTEGER NOT NULL,
                    price NUMERIC NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            self.conn.commit()
            logger.info("PostgreSQL tables verified/initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing tables: {e}")
            self.conn.rollback()
        finally:
            cur.close()

    def seed_initial_data(self):
        """Injects initial starter data if the tables are completely empty."""
        cur = self.conn.cursor()
        try:
            # Seed Fuel Types
            cur.execute("SELECT COUNT(*) FROM fuel")
            if cur.fetchone()[0] == 0:
                logger.info("Seeding initial Fuel data...")
                fuels = ['Gasoline', 'Diesel', 'Hybrid', 'Electric']
                for f in fuels:
                    cur.execute("INSERT INTO fuel (fuel_name) VALUES (%s)", (f,))
            
            # Seed Brands and Models
            cur.execute("SELECT COUNT(*) FROM brand")
            if cur.fetchone()[0] == 0:
                logger.info("Seeding initial Brand and Model data...")
                
                # Insert Brands and get their new IDs back
                brands = ['BMW', 'Mercedes-Benz', 'Toyota', 'Honda']
                brand_ids = {}
                for b in brands:
                    cur.execute("INSERT INTO brand (brand_name) VALUES (%s) RETURNING brand_id", (b,))
                    brand_ids[b] = cur.fetchone()[0]
                
                # Link specific models to the correct brand IDs
                models = [
                    (brand_ids['BMW'], '320i'), (brand_ids['BMW'], '520i'),
                    (brand_ids['Mercedes-Benz'], 'C200'), (brand_ids['Mercedes-Benz'], 'E250'),
                    (brand_ids['Toyota'], 'Corolla'), (brand_ids['Toyota'], 'Civic'),
                    (brand_ids['Honda'], 'Civic'), (brand_ids['Honda'], 'Accord')
                ]
                
                for b_id, m_name in models:
                    cur.execute("INSERT INTO model (brand_id, model_name) VALUES (%s, %s)", (b_id, m_name))
            
            self.conn.commit()
        except Exception as e:
            logger.error(f"Error seeding data: {e}")
            self.conn.rollback()
        finally:
            cur.close()

    def close_connection(self):
        """Safely closes the database connection."""
        self.conn.close()