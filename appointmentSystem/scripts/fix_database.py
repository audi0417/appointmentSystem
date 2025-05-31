#!/usr/bin/env python3
"""
資料庫修正腳本
修正Users表缺少商家相關欄位的問題
"""

import sys
import os
from datetime import datetime

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from sqlalchemy import text

def fix_database_schema():
    """修正資料庫架構，添加缺少的欄位"""
    app = create_app('development')
    
    with app.app_context():
        try:
            print("🔍 檢查資料庫架構...")
            
            # 檢查Users表結構
            result = db.engine.execute(text("PRAGMA table_info(users)"))
            existing_columns = [row[1] for row in result]
            print(f"現有欄位: {existing_columns}")
            
            # 需要添加的欄位
            required_columns = {
                'email': 'VARCHAR(120)',
                'business_name': 'VARCHAR(100)',
                'avatar_url': 'VARCHAR(255)',
                'phone': 'VARCHAR(20)',
                'address': 'TEXT',
                'reset_token': 'VARCHAR(100)',
                'reset_token_expires': 'DATETIME',
                'updated_at': 'DATETIME'
            }
            
            # 添加缺少的欄位
            for column_name, column_type in required_columns.items():
                if column_name not in existing_columns:
                    print(f"➕ 添加欄位: {column_name}")
                    try:
                        sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                        db.engine.execute(text(sql))
                        print(f"✅ 成功添加欄位: {column_name}")
                    except Exception as e:
                        print(f"❌ 添加欄位失敗 {column_name}: {str(e)}")
                else:
                    print(f"✓ 欄位已存在: {column_name}")
            
            # 檢查並修正現有admin用戶
            admin_user = User.query.filter_by(username='admin').first()
            if admin_user:
                print("\n🔄 更新admin用戶資料...")
                
                # 確保商家資訊完整
                if not admin_user.business_name:
                    admin_user.business_name = '美甲工作室'
                if not admin_user.email:
                    admin_user.email = 'admin@nailsalon.com'
                if not admin_user.phone:
                    admin_user.phone = '0912-345-678'
                if not admin_user.address:
                    admin_user.address = '台北市信義區美甲街123號'
                if not admin_user.avatar_url:
                    admin_user.avatar_url = '/static/images/default-avatar.svg'
                
                admin_user.updated_at = datetime.utcnow()
                
                try:
                    db.session.commit()
                    print("✅ admin用戶資料更新成功")
                    print(f"   商家名稱: {admin_user.business_name}")
                    print(f"   用戶名: {admin_user.username}")
                    print(f"   電子郵件: {admin_user.email}")
                except Exception as e:
                    print(f"❌ 更新admin用戶失敗: {str(e)}")
                    db.session.rollback()
            else:
                print("⚠️ 找不到admin用戶")
            
            print("\n✅ 資料庫架構修正完成！")
            
        except Exception as e:
            print(f"❌ 資料庫修正失敗: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    fix_database_schema()
