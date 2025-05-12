# app/routes/admin.py
from flask import Blueprint, render_template, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # 檢查使用者權限
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@bp.route('/')
@admin_required()
def index():
    return render_template('admin/admin.html')

@bp.route('/dashboard')
@admin_required()
def dashboard():
    return render_template('admin/dashboard.html')

@bp.route('/appointments')
@admin_required()
def appointments():
    return render_template('admin/appointments.html')

@bp.route('/members')
@admin_required()
def members():
    return render_template('admin/members.html')

@bp.route('/portfolio')
@admin_required()
def portfolio():
    return render_template('admin/portfolio.html')

@bp.route('/services')
@admin_required()
def services():
    return render_template('admin/services.html')