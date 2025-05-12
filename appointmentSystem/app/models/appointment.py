from app import db
from datetime import datetime

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'))
    customer_name = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled
    amount = db.Column(db.Float)
    deposit = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 額外服務（JSON格式存儲）
    extra_services = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'service_id': self.service_id,
            'customer_name': self.customer_name,
            'phone': self.phone,
            'appointment_date': self.appointment_date.isoformat(),
            'status': self.status,
            'amount': self.amount,
            'deposit': self.deposit,
            'extra_services': self.extra_services,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }