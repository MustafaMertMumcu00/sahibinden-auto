import os
import logging
from app import create_app
from app.init_db import DatabaseManager
from discount_generator import start_discount_generator

# ensuring the logs directory exists
if not os.path.exists('logs'):
    os.mkdir('logs')

# configuring the logging system
logging.basicConfig(
    level=logging.INFO,  # Logs INFO, WARNING, ERROR, and CRITICAL messages
    format='%(asctime)s - [%(name)s] - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log', encoding='utf-8'), # Saves logs to a file
        logging.StreamHandler()                                # Prints logs to the terminal
    ]
)

app = create_app()

# Start the background thread, passing the Flask app instance
start_discount_generator(app)

if __name__ == '__main__':
    port = int(app.config.get('PORT'))
    is_debug = app.config.get('DEBUG')
    
    # Initialize using the class
    with app.app_context():
        db_manager = DatabaseManager()
        db_manager.initialize_tables()
        db_manager.seed_initial_data()
        db_manager.close_connection()
    
    logging.info(f"Starting Sahibinden Auto Flask Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=is_debug)