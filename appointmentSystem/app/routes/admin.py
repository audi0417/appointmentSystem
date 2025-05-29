# app/routes/admin.py
from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
import json
import os

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

@bp.route('/settings')
@admin_required()
def settings():
    return render_template('admin/settings.html')

# 設定 API 路由
@bp.route('/api/settings', methods=['GET'])
@admin_required()
def get_settings():
    """獲取系統設定"""
    try:
        # 模擬從資料庫或配置文件讀取設定
        settings = {
            'basic': {
                'storeName': '美甲工作室',
                'storeNameEn': 'Nail Art Studio',
                'phone': '02-1234-5678',
                'email': 'info@nailstudio.com',
                'address': '台北市大安區忠孝東路四段123號',
                'description': '專業美甲服務，提供各種美甲設計',
                'avatar': '/static/images/default-store.svg',
                'businessHours': {
                    'monday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'tuesday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'wednesday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'thursday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'friday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'saturday': {'open': '10:00', 'close': '18:00', 'enabled': True},
                    'sunday': {'open': '', 'close': '', 'enabled': False}
                }
            },
            'api': {
                'lineChannelId': '',
                'lineChannelSecret': '',
                'lineAccessToken': '',
                'googleMapsApiKey': ''
            },
            'social': {
                'fbAppId': '',
                'fbAppSecret': '',
                'fbPageToken': '',
                'fbPageId': '',
                'fbAutoPost': False,
                'fbPostBooking': False,
                'igAccountId': '',
                'igAccessToken': '',
                'igAutoPost': False,
                'igDefaultHashtags': '#美甲 #nailart #taipei'
            },
            'notifications': {
                'emailNewBooking': True,
                'emailBookingReminder': True,
                'emailCancellation': True,
                'lineNewBooking': False,
                'lineBookingReminder': False,
                'systemMaintenance': True,
                'systemUpdate': True
            }
        }
        
        return jsonify({
            'success': True,
            'data': settings
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@bp.route('/api/settings', methods=['POST'])
@admin_required()
def save_settings():
    """儲存系統設定"""
    try:
        data = request.get_json()
        
        # 驗證必要欄位
        if not data.get('basic', {}).get('storeName'):
            return jsonify({
                'success': False,
                'message': '商家名稱為必填欄位'
            }), 400
        
        # 在實際應用中，這裡會將設定儲存到資料庫
        # 目前只是模擬儲存過程
        print(f"儲存設定: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        return jsonify({
            'success': True,
            'message': '設定已成功儲存'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'儲存失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/test-line', methods=['POST'])
@admin_required()
def test_line_api():
    """測試 LINE API 連接"""
    try:
        data = request.get_json()
        channel_id = data.get('channelId')
        channel_secret = data.get('channelSecret')
        access_token = data.get('accessToken')
        
        if not all([channel_id, channel_secret, access_token]):
            return jsonify({
                'success': False,
                'message': '請提供完整的 LINE API 資訊'
            }), 400
        
        # 模擬 API 測試
        # 在實際應用中，這裡會調用 LINE API 進行驗證
        import time
        time.sleep(1)  # 模擬網路延遲
        
        # 模擬 70% 成功率
        import random
        success = random.random() > 0.3
        
        if success:
            return jsonify({
                'success': True,
                'message': 'LINE API 連接測試成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'LINE API 連接測試失敗，請檢查設定資訊'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'測試失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/test-maps', methods=['POST'])
@admin_required()
def test_maps_api():
    """測試 Google Maps API"""
    try:
        data = request.get_json()
        api_key = data.get('apiKey')
        
        if not api_key:
            return jsonify({
                'success': False,
                'message': '請提供 Google Maps API Key'
            }), 400
        
        # 模擬 API 測試
        import time
        time.sleep(1)
        
        import random
        success = random.random() > 0.2  # 80% 成功率
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Google Maps API 有效'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Google Maps API 無效，請檢查 API Key'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'測試失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/test-facebook', methods=['POST'])
@admin_required()
def test_facebook_api():
    """測試 Facebook API"""
    try:
        data = request.get_json()
        app_id = data.get('appId')
        app_secret = data.get('appSecret')
        page_token = data.get('pageToken')
        
        if not all([app_id, app_secret, page_token]):
            return jsonify({
                'success': False,
                'message': '請提供完整的 Facebook API 資訊'
            }), 400
        
        # 模擬 API 測試
        import time
        time.sleep(1.5)
        
        import random
        success = random.random() > 0.3
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Facebook API 連接成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Facebook API 連接失敗，請檢查設定資訊'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'測試失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/test-instagram', methods=['POST'])
@admin_required()
def test_instagram_api():
    """測試 Instagram API"""
    try:
        data = request.get_json()
        account_id = data.get('accountId')
        access_token = data.get('accessToken')
        
        if not all([account_id, access_token]):
            return jsonify({
                'success': False,
                'message': '請提供完整的 Instagram API 資訊'
            }), 400
        
        # 模擬 API 測試
        import time
        time.sleep(1.5)
        
        import random
        success = random.random() > 0.3
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Instagram API 連接成功'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Instagram API 連接失敗，請檢查設定資訊'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'測試失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/test-post/<platform>', methods=['POST'])
@admin_required()
def test_social_post(platform):
    """測試社群媒體發文"""
    try:
        if platform not in ['facebook', 'instagram']:
            return jsonify({
                'success': False,
                'message': '不支援的平台'
            }), 400
        
        # 模擬發文測試
        import time
        time.sleep(2)
        
        import random
        success = random.random() > 0.2  # 80% 成功率
        
        platform_name = 'Facebook' if platform == 'facebook' else 'Instagram'
        
        if success:
            return jsonify({
                'success': True,
                'message': f'{platform_name} 測試發文成功！已發布到您的 {platform_name} 帳戶'
            })
        else:
            return jsonify({
                'success': False,
                'message': f'{platform_name} 測試發文失敗，請檢查權限設定'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'發文測試失敗: {str(e)}'
        }), 500

@bp.route('/api/settings/upload-avatar', methods=['POST'])
@admin_required()
def upload_avatar():
    """上傳商家大頭貼"""
    try:
        if 'avatar' not in request.files:
            return jsonify({
                'success': False,
                'message': '沒有選擇檔案'
            }), 400
        
        file = request.files['avatar']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '沒有選擇檔案'
            }), 400
        
        # 檢查檔案類型
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                'success': False,
                'message': '不支援的檔案格式'
            }), 400
        
        # 檢查檔案大小 (2MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 2 * 1024 * 1024:  # 2MB
            return jsonify({
                'success': False,
                'message': '檔案大小不能超過 2MB'
            }), 400
        
        # 在實際應用中，這裡會將檔案儲存到適當的位置
        # 目前只是模擬上傳過程
        import time
        time.sleep(1)
        
        # 模擬返回上傳後的檔案路徑
        avatar_url = f'/static/images/avatars/{file.filename}'
        
        return jsonify({
            'success': True,
            'message': '大頭貼上傳成功',
            'avatar_url': avatar_url
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'上傳失敗: {str(e)}'
        }), 500