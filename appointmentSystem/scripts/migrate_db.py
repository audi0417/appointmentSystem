#!/usr/bin/env python3
"""
資料庫遷移腳本
更新 users 表結構以支持新的登入系統功能
"""

import sys
import os

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from datetime import datetime
import sqlite3

def migrate_database():
    """遷移資料庫結構"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 獲取資料庫檔案路徑
            db_path = app.config.get('SQLALCHEMY_DATABASE_URI', '').replace('sqlite:///', '')
            
            if not db_path:
                print("❌ 無法找到資料庫配置")
                return
                
            print(f"📁 資料庫檔案: {db_path}")
            
            # 連接到 SQLite 資料庫
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 檢查當前 users 表結構
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            existing_columns = [col[1] for col in columns]
            
            print("📋 現有欄位:", existing_columns)
            
            # 需要添加的新欄位
            new_columns = [
                ('email', 'VARCHAR(120)'),
                ('business_name', 'VARCHAR(100)'),
                ('avatar_url', 'VARCHAR(255)'),
                ('phone', 'VARCHAR(20)'),
                ('address', 'TEXT'),
                ('reset_token', 'VARCHAR(100)'),
                ('reset_token_expires', 'DATETIME'),
                ('updated_at', 'DATETIME')
            ]
            
            # 添加缺少的欄位
            for col_name, col_type in new_columns:
                if col_name not in existing_columns:
                    try:
                        cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                        print(f"✅ 已添加欄位: {col_name}")
                    except sqlite3.OperationalError as e:
                        print(f"⚠️ 添加欄位 {col_name} 時出錯: {e}")
            
            # 提交變更
            conn.commit()
            
            # 檢查更新後的表結構
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            updated_columns = [col[1] for col in columns]
            
            print("📋 更新後欄位:", updated_columns)
            
            # 關閉連接
            conn.close()
            
            print("✅ 資料庫遷移完成！")
            
            # 現在創建管理員用戶
            create_admin_user()
            
        except Exception as e:
            print(f"❌ 遷移過程中發生錯誤: {str(e)}")
            import traceback
            traceback.print_exc()

def create_admin_user():
    """創建管理員用戶"""
    try:
        # 檢查是否已存在管理員用戶
        admin = User.query.filter_by(username='admin').first()
        
        if not admin:
            # 創建管理員用戶
            admin = User(
                username='admin',
                email='admin@nailsalon.com',
                role='admin',
                status='active',
                business_name='美甲工作室',
                phone='0912-345-678',
                address='台北市信義區美甲街123號',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            admin.set_password('admin123')  # 設置密碼為 admin123
            
            db.session.add(admin)
            db.session.commit()
            
            print("\n🎉 管理員用戶創建成功！")
            print("=" * 50)
            print("👤 用戶名: admin")
            print("🔐 密碼: admin123")
            print("📧 郵箱: admin@nailsalon.com")
            print("🏪 商家名稱: 美甲工作室")
            print("📱 電話: 0912-345-678")
            print("📍 地址: 台北市信義區美甲街123號")
            print("=" * 50)
            print("🌐 登入網址: http://localhost:5050/api/auth/login")
            print("💡 請使用上述帳號密碼登入系統")
            
        else:
            print("\n⚠️ 管理員用戶已存在")
            print("👤 用戶名: admin")
            print("📧 郵箱:", admin.email or "未設定")
            print("🏪 商家名稱:", admin.business_name or "未設定")
            print("\n如需重置密碼，請使用忘記密碼功能")
            
    except Exception as e:
        print(f"❌ 創建管理員用戶時發生錯誤: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("🚀 開始資料庫遷移...")
    migrate_database()
