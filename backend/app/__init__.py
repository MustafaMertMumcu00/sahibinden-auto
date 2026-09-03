import json
import os
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Define path to config.json
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')

    # Use Flask's built-in JSON loader
    if os.path.exists(config_path):
        app.config.from_file(config_path, load=json.load)
    else:
        # Safety fallback if config.json is missing
        app.config.update(
            DEBUG=os.environ.get("FLASK_DEBUG"),
            PORT=int(os.environ.get("FLASK_PORT")),
            SECRET_KEY=os.environ.get("FLASK_SECRET_KEY")
        )

    # Enable CORS for Angular frontend requests
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    from app.routes.car_listing_controller import car_listing_bp
    from app.routes.auth_controller import auth_bp
    from app.routes.catalog_controller import catalog_bp

    app.register_blueprint(car_listing_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(catalog_bp)
    
    return app