from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.service import Service
from app.utils.helpers import save_image
from app import db

bp = Blueprint('services', __name__, url_prefix='/api/services')

@bp.route('/', methods=['GET'])
def get_services():
    try:
        services = Service.query.all()
        return jsonify({
            'status': 'success',
            'data': [service.to_dict() for service in services]
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_service():
    try:
        data = request.form.to_dict()
        image = request.files.get('image')
        
        if image:
            image_path = save_image(image)
            data['image_url'] = image_path
            
        service = Service(**data)
        db.session.add(service)
        db.session.commit()
        
        return jsonify({'status': 'success', 'data': service.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500