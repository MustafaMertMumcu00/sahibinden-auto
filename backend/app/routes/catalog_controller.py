from flask import Blueprint, jsonify
from app.services.catalog_service import CatalogService

catalog_bp = Blueprint('catalog_controller', __name__, url_prefix='/api/catalog')

@catalog_bp.route('/brands', methods=['GET'])
def get_brands():
    """Endpoint to get all brands."""
    service = CatalogService()
    brands = service.get_all_brands()
    return jsonify(brands), 200

@catalog_bp.route('/brands/<int:brand_id>/models', methods=['GET'])
def get_models(brand_id):
    """Endpoint to get models for a specific brand."""
    service = CatalogService()
    models = service.get_models_by_brand(brand_id)
    return jsonify(models), 200

@catalog_bp.route('/fuels', methods=['GET'])
def get_fuels():
    """Endpoint to get all fuel types."""
    service = CatalogService()
    fuels = service.get_all_fuels()
    return jsonify(fuels), 200