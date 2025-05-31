#!/usr/bin/env python3
"""
修正後的初始化管理員腳本
確保帳號與商家資訊一致
"""

import sys
import os

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User
from datetime import datetime

def init_admin_user():
    """創建管理員用戶"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # 創建所有資料表
            db.create_all()
            
            # 檢查是否已存在管理員用戶
            admin = User.query.filter_by(username='admin').first()
            
            if not admin:
                # 創建管理員用戶 - 確保所有欄位完整
                admin = User(
                    username='admin',
                    email='admin@nailsalon.com',
                    role='admin',
                    status='active',
                    business_name='美甲工作室',  # 重要：商家名稱與帳號名稱要一致
                    phone='0912-345-678',
                    address='台北市信義區美甲街123號',
                    avatar_url='/static/images/default-avatar.svg',
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                admin.set_password('admin123')  # 設置密碼為 admin123
                
                db.session.add(admin)
                db.session.commit()
                
                print("✅ 管理員用戶創建成功！")
                print("👤 用戶名: admin")
                print("🔐 密碼: admin123")
                print("📧 郵箱: admin@nailsalon.com")
                print("🏪 商家名稱: 美甲工作室")
                print("📞 電話: 0912-345-678")
                print("📍 地址: 台北市信義區美甲街123號")
                print("\n重要提醒：")
                print("- 商家名稱將顯示在系統左下角")
                print("- 可在設定頁面修改商家基本資料")
                print("- 修改後會同步更新左下角顯示")
                print("\n現在可以使用以上資訊登入系統：")
                print("🌐 登入網址: http://localhost:5050/api/auth/login")
            else:
                print("⚠️  管理員用戶已存在")
                print("👤 用戶名: admin")
                print("📧 郵箱:", admin.email)
                print("🏪 商家名稱:", admin.business_name)
                print("📞 電話:", admin.phone)
                print("📍 地址:", admin.address)
                
                # 檢查並更新缺少的欄位
                updated = False
                if not admin.business_name:
                    admin.business_name = '美甲工作室'
                    updated = True
                if not admin.email:
                    admin.email = 'admin@nailsalon.com'
                    updated = True
                if not admin.phone:
                    admin.phone = '0912-345-678'
                    updated = True
                if not admin.address:
                    admin.address = '台北市信義區美甲街123號'
                    updated = True
                if not admin.avatar_url:
                    admin.avatar_url = '/static/images/default-avatar.svg'
                    updated = True
                    
                if updated:
                    admin.updated_at = datetime.utcnow()
                    db.session.commit()
                    print("✅ 用戶資料已更新完整")
                
                print("\n如需重置密碼，請使用忘記密碼功能")
                
        except Exception as e:
            print(f"❌ 創建用戶時發生錯誤: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    init_admin_user()
