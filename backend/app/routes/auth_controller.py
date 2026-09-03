import logging
from flask import Blueprint, request, jsonify, session
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth_controller', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Endpoint for creating a new user account."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    # Instantiate the class
    auth_service = AuthService()
    result = auth_service.register_user(username, password)
    
    if "error" in result:
        logger.warning(f"Signup failed for username '{username}': {result['error']}")
        return jsonify(result), 400

    # Save the user ID in the session
    session['user_id'] = result['user']['user_id']
    
    logger.info(f"New user registered and logged in: {username} (ID: {result['user']['user_id']})")
    return jsonify({"message": "User created successfully.", "user": result["user"]}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint for authenticating a user."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    # Instantiate the class
    auth_service = AuthService()
    result = auth_service.login_user(username, password)
    
    if "error" in result:
        logger.warning(f"Failed login attempt for username: {username}")
        return jsonify(result), 401

    # Save the user ID in the session
    session['user_id'] = result['user']['user_id']
    
    logger.info(f"User logged in successfully: {username}")
    return jsonify({"message": "Login successful.", "user": result["user"]}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clears the user session."""
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully."}), 200