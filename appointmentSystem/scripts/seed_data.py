import os
import sys
# 將專案根目錄加入到 Python 路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Service, Member, Portfolio
from datetime import datetime, timedelta
import random

def seed_database():
    app = create_app('development')
    with app.app_context():
        # 添加服務項目
        services = [
            {
                'name': '基礎美甲',
                'category': '基礎護理',
                'description': '基礎指甲護理，包含修型、死皮處理等',
                'price': 600,
                'duration': 60,
                'status': 'active'
            },
            {
                'name': '凝膠美甲',
                'category': '造型美甲',
                'description': '使用凝膠材料進行美甲造型',
                'price': 1200,
                'duration': 90,
                'status': 'active'
            }
        ]
        
        for service_data in services:
            if not Service.query.filter_by(name=service_data['name']).first():
                service = Service(**service_data)
                db.session.add(service)
        
        # 添加會員
        members = [
            {
                'name': '王小明',
                'phone': '0912345678',
                'email': 'wang@example.com',
                'level': 'normal',
                'status': 'active'
            },
            {
                'name': '李小美',
                'phone': '0923456789',
                'email': 'lee@example.com',
                'level': 'vip',
                'status': 'active'
            }
        ]
        
        for member_data in members:
            if not Member.query.filter_by(phone=member_data['phone']).first():
                member = Member(**member_data)
                db.session.add(member)
        
        db.session.commit()
        print('測試資料添加完成')

if __name__ == '__main__':
    seed_database()