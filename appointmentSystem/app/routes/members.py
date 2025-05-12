from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.member import Member
from app import db
from datetime import datetime

bp = Blueprint('members', __name__, url_prefix='/api/members')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_members():
    try:
        status = request.args.get('status')
        level = request.args.get('level')
        search = request.args.get('search')
        
        query = Member.query
        
        # 篩選條件
        if status:
            query = query.filter_by(status=status)
        if level:
            query = query.filter_by(level=level)
        if search:
            query = query.filter(
                (Member.name.ilike(f'%{search}%')) |
                (Member.phone.ilike(f'%{search}%')) |
                (Member.email.ilike(f'%{search}%'))
            )
            
        members = query.all()
        return jsonify({
            'status': 'success',
            'data': [member.to_dict() for member in members]
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_member():
    try:
        data = request.get_json()
        
        # 檢查手機號碼是否已存在
        if Member.query.filter_by(phone=data.get('phone')).first():
            return jsonify({'status': 'error', 'message': '此手機號碼已註冊'}), 400
            
        member = Member(
            name=data.get('name'),
            phone=data.get('phone'),
            email=data.get('email'),
            level=data.get('level', 'normal'),
            join_date=datetime.now(),
            status='active'
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({'status': 'success', 'data': member.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_member(id):
    try:
        member = Member.query.get_or_404(id)
        data = request.get_json()
        
        # 檢查手機號碼是否被其他會員使用
        if data.get('phone'):
            existing_member = Member.query.filter_by(phone=data.get('phone')).first()
            if existing_member and existing_member.id != id:
                return jsonify({'status': 'error', 'message': '此手機號碼已被使用'}), 400
        
        for key, value in data.items():
            if hasattr(member, key):
                setattr(member, key, value)
                
        db.session.commit()
        return jsonify({'status': 'success', 'data': member.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_member(id):
    try:
        member = Member.query.get_or_404(id)
        
        # 軟刪除：將狀態改為停用
        member.status = 'inactive'
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': '會員已停用'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_member_statistics():
    try:
        total_members = Member.query.count()
        active_members = Member.query.filter_by(status='active').count()
        vip_members = Member.query.filter_by(level='vip').count()
        
        return jsonify({
            'status': 'success',
            'data': {
                'total_members': total_members,
                'active_members': active_members,
                'vip_members': vip_members
            }
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500