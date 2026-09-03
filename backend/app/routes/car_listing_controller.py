import logging
from flask import Blueprint, jsonify, request, session
from app.services.car_listing_service import CarListingService

car_listing_bp = Blueprint('car_listing_controller', __name__, url_prefix='/api/listings')
logger = logging.getLogger(__name__)

# --- Helper function to check auth ---
def get_logged_in_user():
    """Returns the user_id from the session, or None if not logged in."""
    return session.get('user_id')

@car_listing_bp.route('', methods=['GET'])
def get_all_listings():
    """Public endpoint to fetch all car listings from all users."""
    logger.info("Fetching all public car listings.")
    try:
        listing_service = CarListingService()
        listings = listing_service.get_all_public_listings()
        return jsonify(listings), 200
    except Exception as e:
        logger.error(f"Error fetching public listings: {e}")
        return jsonify({"error": "Failed to load listings."}), 500
    
@car_listing_bp.route('/me', methods=['GET'])
def get_my_listings():
    """Fetches listings strictly for the currently logged-in user."""
    user_id = get_logged_in_user()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    logger.info(f"Fetching car listings for session user_id: {user_id}")
    listing_service = CarListingService()
    listings = listing_service.get_user_listings(user_id)
    
    return jsonify(listings), 200

@car_listing_bp.route('', methods=['POST'])
def create_listing():
    """Adds a new car listing assigned to the currently logged-in user."""
    user_id = get_logged_in_user()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    data = request.get_json()
    
    try:
        listing_service = CarListingService()
        new_listing = listing_service.add_listing(user_id, data)
        
        logger.info(f"New car listing created for user {user_id} (Car ID: {new_listing['car_id']})")
        return jsonify({"message": "Listing created successfully", "listing": new_listing}), 201
    except Exception as e:
        logger.error(f"Error creating listing for user {user_id}: {e}")
        return jsonify({"error": "Failed to create listing. Please check your data."}), 500

@car_listing_bp.route('/<int:car_id>', methods=['DELETE'])
def remove_listing(car_id):
    """Deletes a listing verifying ownership via session user_id."""
    user_id = get_logged_in_user()
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401

    logger.info(f"User {user_id} attempting to delete car listing ID: {car_id}")
    
    listing_service = CarListingService()
    success = listing_service.delete_listing(car_id, user_id)
    
    if success:
        logger.info(f"Successfully deleted car listing ID: {car_id} for user {user_id}")
        return jsonify({"message": f"Listing {car_id} deleted successfully"}), 200
    else:
        logger.warning(f"Delete failed: Car listing {car_id} not found or unauthorized for user {user_id}")
        return jsonify({"error": "Listing not found or unauthorized."}), 404


# @car_listing_bp.route('/<int:car_id>/discount', methods=['POST'])
# def apply_discount(car_id):
#     """Applies a discount to an existing car listing and triggers a RabbitMQ event."""
#     user_id = get_logged_in_user()
#     if not user_id:
#         return jsonify({"error": "Unauthorized. Please log in."}), 401

#     data = request.get_json()
#     new_price = data.get('new_price')
    
#     if new_price is None:
#         return jsonify({"error": "new_price is required."}), 400

#     try:
#         listing_service = CarListingService()
#         discount_data = listing_service.apply_discount(car_id, user_id, new_price)
        
#         if discount_data:
#             logger.info(f"Discount applied to car {car_id} by user {user_id}")
#             return jsonify({"message": "Discount broadcasted successfully", "data": discount_data}), 200
#         else:
#             logger.warning(f"Discount failed: Car listing {car_id} not found or unauthorized for user {user_id}")
#             return jsonify({"error": "Listing not found or unauthorized."}), 404
            
#     except Exception as e:
#         logger.error(f"Error applying discount to car {car_id}: {e}")
#         return jsonify({"error": "Failed to apply discount."}), 500