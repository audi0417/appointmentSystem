from app import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
import secrets

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='admin')  # admin, staff
    status = db.Column(db.String(20), default='active')
    
    # 商家信息
    business_name = db.Column(db.String(100), nullable=True)  # 商家名稱
    avatar_url = db.Column(db.String(255), nullable=True)     # 頭像URL
    phone = db.Column(db.String(20), nullable=True)          # 電話
    address = db.Column(db.Text, nullable=True)              # 地址
    
    # 密碼重置相關
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        """設置密碼"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """檢查密碼"""
        return check_password_hash(self.password_hash, password)
    
    def generate_reset_token(self):
        """生成密碼重置令牌"""
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # 1小時有效期
        return self.reset_token
    
    def verify_reset_token(self, token):
        """驗證重置令牌"""
        if not self.reset_token or not self.reset_token_expires:
            return False
        if datetime.utcnow() > self.reset_token_expires:
            return False
        return self.reset_token == token
    
    def clear_reset_token(self):
        """清除重置令牌"""
        self.reset_token = None
        self.reset_token_expires = None
    
    def get_avatar_url(self):
        """獲取頭像URL，如果沒有則返回默認頭像"""
        if self.avatar_url:
            return self.avatar_url
        return '/static/images/default-avatar.svg'
    
    def get_display_name(self):
        """獲取顯示名稱"""
        return self.business_name or self.username

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'status': self.status,
            'business_name': self.business_name,
            'avatar_url': self.get_avatar_url(),
            'phone': self.phone,
            'address': self.address,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }