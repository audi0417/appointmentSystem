from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.appointment import Appointment
from app import db
from datetime import datetime

bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_appointments():
    try:
        status = request.args.get('status')
        date = request.args.get('date')
        
        query = Appointment.query
        
        if status:
            query = query.filter_by(status=status)
        if date:
            query = query.filter(Appointment.appointment_date >= datetime.strptime(date, '%Y-%m-%d'))
            
        appointments = query.all()
        return jsonify({
            'status': 'success',
            'data': [appointment.to_dict() for appointment in appointments]
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        data = request.get_json()
        
        appointment = Appointment(
            customer_name=data.get('customerName'),
            phone=data.get('phone'),
            service_id=data.get('serviceId'),
            appointment_date=datetime.strptime(data.get('appointmentDate'), '%Y-%m-%d %H:%M'),
            status='pending',
            notes=data.get('notes')
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({'status': 'success', 'data': appointment.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_appointment(id):
    try:
        appointment = Appointment.query.get_or_404(id)
        data = request.get_json()
        
        for key, value in data.items():
            if hasattr(appointment, key):
                setattr(appointment, key, value)
                
        db.session.commit()
        return jsonify({'status': 'success', 'data': appointment.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(id):
    try:
        appointment = Appointment.query.get_or_404(id)
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'status': 'success', 'message': '預約已刪除'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500