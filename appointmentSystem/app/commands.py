import click
from flask.cli import with_appcontext

def register_commands(db):
    def init_commands(app):
        @app.cli.command('create-admin')
        @click.argument('username')
        @click.argument('password')
        def create_admin(username, password):
            """創建管理員帳號"""
            from app.models import User
            from werkzeug.security import generate_password_hash
            
            user = User(
                username=username,
                password_hash=generate_password_hash(password),
                role='admin'
            )
            db.session.add(user)
            db.session.commit()
            click.echo(f'管理員 {username} 創建成功')

        @app.cli.command('init-db')
        def init_db():
            """初始化資料庫"""
            db.create_all()
            click.echo('資料庫表創建完成')

        @app.cli.command('drop-db')
        def drop_db():
            """刪除所有資料庫表"""
            if click.confirm('確定要刪除所有資料嗎？'):
                db.drop_all()
                click.echo('資料庫表已刪除')
    
    return init_commands