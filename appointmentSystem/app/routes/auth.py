from flask import Blueprint, app, render_template, request, redirect, url_for, jsonify, session
from flask_jwt_extended import (
    create_access_token, 
    set_access_cookies,
    unset_access_cookies,
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from flask_cors import cross_origin
from app import db
from datetime import datetime

# 創建認證藍圖，設置路由前綴為 /api/auth
bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['GET'])
def login_page():
    """
    渲染登入頁面
    如果用戶已登入，重定向到管理後台首頁
    """
    if 'access_token' in session:
        return redirect(url_for('admin.index'))
    return render_template('admin/login.html')

@bp.route('/login', methods=['POST'])
def login():
    """處理登入"""
    try:
        # 獲取表單數據
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            return render_template('admin/login.html', error='請輸入用戶名和密碼')
            
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            # 創建訪問令牌
            access_token = create_access_token(identity=user.id)
            
            # 設置 session
            session['access_token'] = access_token
            session['user_id'] = user.id
            session['username'] = user.username
            
            # 更新最後登入時間
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # 創建回應
            response = redirect(url_for('admin.index'))
            set_access_cookies(response, access_token)
            return response
            
        return render_template('admin/login.html', error='用戶名或密碼錯誤')
            
    except Exception as e:
        app.logger.error(f'登入錯誤: {str(e)}')
        return render_template('admin/login.html', error='登入失敗，請稍後重試')

@bp.route('/logout')
def logout():
    """
    處理用戶登出
    - 清除 session
    - 移除認證 cookie
    - 重定向到登入頁面
    """
    session.clear()
    response = redirect(url_for('auth.login_page'))
    unset_access_cookies(response)
    return response

@bp.route('/register', methods=['POST'])
def register():
    """
    處理用戶註冊
    - 驗證用戶名是否已存在
    - 創建新用戶
    - 設置預設角色
    """
    try:
        data = request.get_json()
        
        # 驗證用戶名是否已存在
        if User.query.filter_by(username=data.get('username')).first():
            return jsonify({
                'status': 'error', 
                'message': '使用者名稱已存在'
            }), 400
            
        # 創建新用戶
        user = User(
            username=data.get('username'),
            password_hash=generate_password_hash(data.get('password')),
            role=data.get('role', 'staff'),
            status='active',
            created_at=datetime.utcnow()
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'status': 'success', 
            'message': '註冊成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error', 
            'message': '註冊失敗，請稍後重試'
        }), 500

@bp.route('/check-auth')
def check_auth():
    """
    檢查用戶認證狀態
    返回當前登入用戶的基本信息
    """
    if 'access_token' in session:
        return jsonify({
            'authenticated': True,
            'username': session.get('username'),
            'role': session.get('role')
        })
    return jsonify({'authenticated': False}), 401

# 測試路由
@bp.route('/test', methods=['GET'])
def test():
    """API 測試端點"""
    return jsonify({"message": "Test successful"}), 200

@bp.route('/ping', methods=['GET'])
def ping():
    """健康檢查端點"""
    return jsonify({"message": "pong"}), 200