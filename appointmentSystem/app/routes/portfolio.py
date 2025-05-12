from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.portfolio import Portfolio
from app.utils.helpers import save_image, delete_image
from app import db

bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')

@bp.route('/', methods=['GET'])
def get_portfolio_items():
    try:
        category = request.args.get('category')
        status = request.args.get('status')
        
        query = Portfolio.query
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
            
        items = query.order_by(Portfolio.created_at.desc()).all()
        return jsonify({
            'status': 'success',
            'data': [item.to_dict() for item in items]
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_portfolio_item():
    try:
        data = request.form.to_dict()
        images = request.files.getlist('images')
        
        if not images:
            return jsonify({'status': 'error', 'message': '請上傳至少一張圖片'}), 400
            
        # 處理多張圖片上傳
        image_urls = []
        for image in images:
            image_url = save_image(image)
            if image_url:
                image_urls.append(image_url)
        
        portfolio_item = Portfolio(
            title=data.get('title'),
            description=data.get('description'),
            category=data.get('category'),
            tags=data.get('tags', '').split(','),
            images=image_urls,
            status=data.get('status', 'active')
        )
        
        db.session.add(portfolio_item)
        db.session.commit()
        
        return jsonify({'status': 'success', 'data': portfolio_item.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        # 刪除已上傳的圖片
        for image_url in image_urls:
            delete_image(image_url)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_portfolio_item(id):
    try:
        portfolio_item = Portfolio.query.get_or_404(id)
        data = request.form.to_dict()
        new_images = request.files.getlist('images')
        
        # 更新基本信息
        portfolio_item.title = data.get('title', portfolio_item.title)
        portfolio_item.description = data.get('description', portfolio_item.description)
        portfolio_item.category = data.get('category', portfolio_item.category)
        if 'tags' in data:
            portfolio_item.tags = data.get('tags').split(',')
        portfolio_item.status = data.get('status', portfolio_item.status)
        
        # 處理圖片更新
        if new_images:
            # 刪除舊圖片
            for old_image in portfolio_item.images:
                delete_image(old_image)
                
            # 上傳新圖片
            image_urls = []
            for image in new_images:
                image_url = save_image(image)
                if image_url:
                    image_urls.append(image_url)
            portfolio_item.images = image_urls
        
        db.session.commit()
        return jsonify({'status': 'success', 'data': portfolio_item.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_item(id):
    try:
        portfolio_item = Portfolio.query.get_or_404(id)
        
        # 刪除關聯的圖片文件
        for image_url in portfolio_item.images:
            delete_image(image_url)
            
        db.session.delete(portfolio_item)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': '作品已刪除'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500