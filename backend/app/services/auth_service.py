from werkzeug.security import generate_password_hash, check_password_hash
from app.db import get_db_connection

class AuthService:
    def __init__(self):
        # Open the connection when the class is instantiated
        self.conn = get_db_connection()

    def register_user(self, username, password):
        """Hashes the password and saves the new user."""
        cur = self.conn.cursor()
        
        try:
            # Check if the username is already taken
            cur.execute("SELECT user_id FROM users WHERE user_name = %s", (username,))
            if cur.fetchone():
                return {"error": "Username already exists."}
            
            # Hash the password securely
            hashed_pw = generate_password_hash(password)
            
            # Insert the new user (matching your new schema)
            cur.execute(
                "INSERT INTO users (user_name, password_hash) VALUES (%s, %s) RETURNING user_id, user_name", 
                (username, hashed_pw)
            )
            row = cur.fetchone()
            self.conn.commit()
            
            # Format the result as a dictionary
            columns = []
    
            for col in cur.description:
                columns.append(col[0])
    
            new_user = dict(zip(columns, row))
            
            return {"user": new_user}
            
        except Exception as e:
            self.conn.rollback()
            return {"error": str(e)}
        finally:
            cur.close()
            self.conn.close()

    def login_user(self, username, password):
        """Verifies the username and password against the database."""
        cur = self.conn.cursor()
        
        try:
            cur.execute("SELECT user_id, user_name, password_hash FROM users WHERE user_name = %s", (username,))
            row = cur.fetchone()
            
            if not row:
                return {"error": "Invalid username or password."}
                
            columns = []
            for col in cur.description:
                columns.append(col[0])
    
            user = dict(zip(columns, row))
            
            # Check if the provided password matches the stored hash
            if not check_password_hash(user['password_hash'], password):
                return {"error": "Invalid username or password."}
                
            return {"user": {"user_id": user['user_id'], "user_name": user['user_name']}}
            
        finally:
            cur.close()
            self.conn.close()