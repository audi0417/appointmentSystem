import os
import uuid
from PIL import Image
from flask import current_app
from werkzeug.utils import secure_filename

def allowed_file(filename):
    """檢查文件類型是否允許"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_image(file, folder='general'):
    """保存圖片並返回URL"""
    try:
        if not file or not allowed_file(file.filename):
            return None
            
        # 生成安全的文件名
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        new_filename = f"{uuid.uuid4().hex}.{ext}"
        
        # 確保目標資料夾存在
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
        os.makedirs(upload_path, exist_ok=True)
        
        filepath = os.path.join(upload_path, new_filename)
        
        # 保存並優化圖片
        image = Image.open(file)
        image = optimize_image(image)
        image.save(filepath, quality=85, optimize=True)
        
        # 返回相對URL
        return f"/static/uploads/{folder}/{new_filename}"
        
    except Exception as e:
        current_app.logger.error(f"圖片保存失敗: {str(e)}")
        return None

def optimize_image(image, max_size=(800, 800)):
    """優化圖片大小和質量"""
    if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
        image.thumbnail(max_size, Image.LANCZOS)
    return image

def delete_image(image_url):
    """刪除圖片文件"""
    try:
        if not image_url:
            return
            
        # 從URL獲取文件路徑
        filepath = os.path.join(
            current_app.config['UPLOAD_FOLDER'],
            image_url.split('/static/uploads/')[-1]
        )
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
    except Exception as e:
        current_app.logger.error(f"圖片刪除失敗: {str(e)}")

def generate_pagination(query, page, per_page):
    """生成分頁數據"""
    pagination = query.paginate(page=page, per_page=per_page)
    return {
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }