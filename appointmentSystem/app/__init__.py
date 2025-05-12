from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from config import config
from datetime import timedelta
from flask_wtf.csrf import CSRFProtect

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name):
    app = Flask(__name__)
    
    # 設置 secret key (必須在 CSRFProtect 之前)
    app.config['SECRET_KEY'] = 'your-secret-key'  # 請更換為安全的密鑰
    
    # 初始化 CSRF 保護
    csrf = CSRFProtect()
    csrf.init_app(app)
    # Load base config
    app.config.from_object(config[config_name])
    
    # JWT configuration 
    app.config.update(
        JWT_SECRET_KEY='your-secret-key',  # Change this to a secure key
        JWT_TOKEN_LOCATION=['cookies', 'headers'],
        JWT_COOKIE_SECURE=False,  # Set to True in production
        JWT_COOKIE_CSRF_PROTECT=False,  # Set to True in production
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1)
    )
    
    # CORS configuration
    app.config['CORS_HEADERS'] = 'Content-Type'
    cors_config = {
        'origins': ['http://localhost:5050'],  # Restrict to specific origins in production
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization'],
        'expose_headers': ['Content-Type', 'Authorization'],
        'supports_credentials': True
    }
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/*": cors_config})
    
    with app.app_context():
        # Import blueprints
        from .routes import (
            auth,
            admin,
            appointments,
            services,
            portfolio,
            members
        )
        
        # Register blueprints
        app.register_blueprint(auth.bp)
        app.register_blueprint(admin.bp)
        app.register_blueprint(appointments.bp)
        app.register_blueprint(services.bp)
        app.register_blueprint(portfolio.bp)
        app.register_blueprint(members.bp)
        
        # Register error handlers
        register_error_handlers(app)
        
        # Register commands
        from .commands import register_commands
        register_commands(db)(app)
    
    return app

def register_error_handlers(app):
    """Register error handlers for the application"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': str(error)
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': '請先登入'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': '無權限執行此操作'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': '找不到請求的資源'
        }), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        db.session.rollback()
        return jsonify({
            'error': 'Internal Server Error',
            'message': '服務器內部錯誤'
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.error(f'未處理的異常: {str(error)}')
        return jsonify({
            'error': 'Internal Server Error',
            'message': '發生未預期的錯誤'
        }), 500