from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .errors import bad_request, unauthorized, forbidden
from app.models import User
from flask import session, redirect, url_for

def admin_login_required():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'access_token' not in session:
                return redirect(url_for('auth.login_page'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required():
    """檢查是否為管理員"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.role != 'admin':
                return forbidden('需要管理員權限')
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def validate_json(*required_fields):
    """驗證請求JSON數據"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return bad_request('Content-Type 必須是 application/json')
            
            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return bad_request(f'缺少必要欄位: {", ".join(missing_fields)}')
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator