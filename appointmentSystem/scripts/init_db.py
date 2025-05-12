import os
import sys
# 將專案根目錄加入到 Python 路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

def init_database():
    app = create_app('development')
    with app.app_context():
        # 創建所有表
        db.create_all()
        
        # 檢查是否已存在管理員帳號
        if not User.query.filter_by(username='admin').first():
            # 創建管理員帳號
            admin = User(
                username='admin',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print('管理員帳號創建成功')
        
        print('資料庫初始化完成')

if __name__ == '__main__':
    init_database()