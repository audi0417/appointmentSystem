from flask import Blueprint, render_template, request, redirect, url_for, jsonify, session, flash
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
import logging

# 創建認證藍圖，設置路由前綴為 /api/auth
bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['GET'])
def login_page():
    """
    渲染登入頁面
    如果用戶已登入，重定向到管理後台首頁
    """
    if 'user_id' in session:
        return redirect(url_for('admin.admin_index'))
    return render_template('admin/login.html')

@bp.route('/login', methods=['POST'])
def login():
    """處理登入"""
    try:
        # 獲取表單數據
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        if not username or not password:
            return render_template('admin/login.html', error='請輸入用戶名和密碼')
            
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            if user.status != 'active':
                return render_template('admin/login.html', error='帳戶已被停用，請聯繫管理員')
            
            # 創建訪問令牌
            access_token = create_access_token(identity=user.id)
            
            # 設置 session
            session['access_token'] = access_token
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['business_name'] = user.business_name
            session['avatar_url'] = user.get_avatar_url()
            
            # 更新最後登入時間
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # 創建回應
            response = redirect(url_for('admin.admin_index'))
            set_access_cookies(response, access_token)
            return response
            
        return render_template('admin/login.html', error='用戶名或密碼錯誤')
            
    except Exception as e:
        logging.error(f'登入錯誤: {str(e)}')
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

@bp.route('/forgot-password', methods=['GET'])
def forgot_password_page():
    """忘記密碼頁面"""
    return render_template('admin/forgot_password.html')

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """處理忘記密碼請求"""
    try:
        email_or_username = request.form.get('email_or_username', '').strip()
        
        if not email_or_username:
            return render_template('admin/forgot_password.html', 
                                 error='請輸入用戶名或郵箱')
        
        # 查找用戶（通過用戶名或郵箱）
        user = User.query.filter(
            (User.username == email_or_username) | 
            (User.email == email_or_username)
        ).first()
        
        if user:
            # 生成重置令牌
            reset_token = user.generate_reset_token()
            db.session.commit()
            
            # 這裡應該發送郵件，暫時只返回成功信息
            # 在實際應用中，你需要配置郵件服務
            return render_template('admin/forgot_password.html', 
                                 success=f'密碼重置鏈接已發送。重置令牌：{reset_token}（請妥善保管）')
        else:
            return render_template('admin/forgot_password.html', 
                                 error='找不到該用戶')
            
    except Exception as e:
        logging.error(f'忘記密碼錯誤: {str(e)}')
        return render_template('admin/forgot_password.html', 
                             error='處理失敗，請稍後重試')

@bp.route('/reset-password', methods=['GET'])
def reset_password_page():
    """重置密碼頁面"""
    token = request.args.get('token')
    if not token:
        return render_template('admin/reset_password.html', error='無效的重置鏈接')
    return render_template('admin/reset_password.html', token=token)

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """處理密碼重置"""
    try:
        token = request.form.get('token')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        if not all([token, new_password, confirm_password]):
            return render_template('admin/reset_password.html', 
                                 token=token, error='請填寫所有欄位')
        
        if new_password != confirm_password:
            return render_template('admin/reset_password.html', 
                                 token=token, error='兩次輸入的密碼不一致')
        
        if len(new_password) < 6:
            return render_template('admin/reset_password.html', 
                                 token=token, error='密碼長度至少6個字符')
        
        # 查找並驗證令牌
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.verify_reset_token(token):
            return render_template('admin/reset_password.html', 
                                 error='重置鏈接已過期或無效')
        
        # 更新密碼
        user.set_password(new_password)
        user.clear_reset_token()
        db.session.commit()
        
        return render_template('admin/login.html', 
                             success='密碼重置成功，請使用新密碼登入')
        
    except Exception as e:
        logging.error(f'重置密碼錯誤: {str(e)}')
        return render_template('admin/reset_password.html', 
                             token=request.form.get('token'), 
                             error='重置失敗，請稍後重試')

@bp.route('/check-auth')
def check_auth():
    """
    檢查用戶認證狀態
    返回當前登入用戶的基本信息
    """
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'authenticated': True,
                'user': user.to_dict()
            })
    return jsonify({'authenticated': False}), 401

@bp.route('/profile', methods=['GET'])
def get_profile():
    """獲取用戶資料"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': '用戶不存在'}), 404
    
    return jsonify(user.to_dict())

@bp.route('/profile', methods=['POST'])
def update_profile():
    """更新用戶資料"""
    if 'user_id' not in session:
        return jsonify({'error': '未登入'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': '用戶不存在'}), 404
    
    try:
        data = request.get_json()
        
        # 更新允許修改的欄位
        if 'business_name' in data:
            user.business_name = data['business_name']
        if 'email' in data:
            # 檢查郵箱是否已存在
            existing_user = User.query.filter(
                User.email == data['email'],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({'error': '郵箱已被使用'}), 400
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'address' in data:
            user.address = data['address']
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # 更新 session
        session['business_name'] = user.business_name
        session['avatar_url'] = user.get_avatar_url()
        
        return jsonify({
            'success': True,
            'message': '資料更新成功',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'更新資料錯誤: {str(e)}')
        return jsonify({'error': '更新失敗，請稍後重試'}), 500

# 測試路由
@bp.route('/test', methods=['GET'])
def test():
    """API 測試端點"""
    return jsonify({"message": "Test successful"}), 200

@bp.route('/ping', methods=['GET'])
def ping():
    """健康檢查端點"""
    return jsonify({"message": "pong"}), 200