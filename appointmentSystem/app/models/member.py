from app import db
from datetime import datetime

class Member(db.Model):
    __tablename__ = 'members'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120))
    level = db.Column(db.String(20), default='normal')  # normal, vip
    points = db.Column(db.Integer, default=0)
    total_spending = db.Column(db.Float, default=0.0)
    visit_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='active')
    join_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_visit = db.Column(db.DateTime)
    notes = db.Column(db.Text)

    # 關聯預約記錄
    appointments = db.relationship('Appointment', backref='member', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'level': self.level,
            'points': self.points,
            'total_spending': self.total_spending,
            'visit_count': self.visit_count,
            'status': self.status,
            'join_date': self.join_date.isoformat(),
            'last_visit': self.last_visit.isoformat() if self.last_visit else None,
            'notes': self.notes
        }