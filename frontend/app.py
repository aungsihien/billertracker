from flask import Flask, jsonify, request
import json
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pandas as pd
import os
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"], "expose_headers": ["Content-Type", "X-Total-Count"]}}, supports_credentials=True)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ISP_EXCEL_FILE = os.path.join(BASE_DIR, 'noti.xlsx')
logger.info(f'ISP Excel file path: {ISP_EXCEL_FILE}')
# Enable CORS for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Database Configuration
import os
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'biller_tracker.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Ensure instance directory exists
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# ISP Status History Model
class ISPStatusHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    isp_name = db.Column(db.String(100), nullable=False)
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20), nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'isp_name': self.isp_name,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None
        }

# Biller Model
class Biller(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    is_top_50 = db.Column(db.Boolean, default=False)
    onboard_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    web = db.Column(db.String(255))  # New column for website

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'status': self.status,
            'is_top_50': self.is_top_50,
            'onboard_date': self.onboard_date.isoformat() if self.onboard_date else None,
            'notes': self.notes,
            'web': self.web
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/dashboard-overview')
def get_dashboard_overview():
    total_billers = db.session.query(Biller).count()
    unavailable_isp = db.session.query(Biller).filter_by(category='ISP').filter(Biller.status != 'go_live').count()
    unavailable_mfi = db.session.query(Biller).filter_by(category='MFI').filter(Biller.status != 'go_live').count()
    last_updated = db.session.query(db.func.max(Biller.onboard_date)).scalar()
    return jsonify({
        'target_count': total_billers,
        'unavailable_isp': unavailable_isp,
        'unavailable_mfi': unavailable_mfi,
        'last_updated': last_updated.isoformat() if last_updated else None
    })

@app.route('/api/top-50-billers', methods=['GET', 'OPTIONS'])
def get_top_50_billers():
    try:
        billers = Biller.query.filter_by(is_top_50=True).all()
        biller_data = [
            {
                'Biller': b.name,
                'Web': b.web or '',
                'Status': b.status,
                'Category': b.category
            }
            for b in billers
        ]
        return jsonify(biller_data)
    except Exception as e:
        logger.error(f'Exception in /api/top-50-billers: {e}')
        return jsonify({'error': str(e)}), 500

from datetime import datetime

@app.route('/api/top-50-billers/status', methods=['POST'])
def update_top_50_biller_status():
    data = request.get_json()
    print('DEBUG /api/top-50-billers/status received data:', data, flush=True)
    biller_name = data.get('Biller')
    new_status = data.get('Status')
    integration_date = data.get('integration_date')
    onboarding_date = data.get('onboarding_date')

    if not biller_name or not new_status:
        return jsonify({'success': False, 'error': 'Missing biller or status'}), 400

    # Find the biller in the database
    biller = Biller.query.filter_by(name=biller_name, category='Top 50').first()
    if not biller:
        return jsonify({'success': False, 'error': 'Biller not found'}), 404

    # Update the status and dates
    biller.status = new_status
    if integration_date:
        try:
            biller.integration_date = datetime.strptime(integration_date, "%Y-%m-%d")
        except Exception:
            pass  # Ignore if field or format is missing
    if onboarding_date:
        try:
            biller.onboard_date = datetime.strptime(onboarding_date, "%Y-%m-%d")
        except Exception:
            pass  # Ignore if field or format is missing
    db.session.commit()

    return jsonify({'success': True, 'message': 'Status updated successfully'})


@app.route('/api/unavailable-isp', methods=['GET'])
def get_unavailable_isp():
    try:
        isps = Biller.query.filter_by(category='ISP').all()
        isp_data = [
            {
                'ISP': b.name,
                'Web': b.web or '',
                'Status': b.status
            }
            for b in isps
        ]
        return jsonify(isp_data)
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-isp: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/unavailable-mfi', methods=['GET'])
def get_unavailable_mfi():
    try:
        mfis = Biller.query.filter_by(category='MFI').all()
        mfi_data = [
            {
                'MFI': b.name,
                'Web': b.web or '',
                'Status': b.status
            }
            for b in mfis
        ]
        return jsonify(mfi_data)
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-mfi: {e}')
        return jsonify({'error': str(e)}), 500

# MFI Status History Model
class MFIStatusHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mfi_name = db.Column(db.String(100), nullable=False)
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20), nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'mfi_name': self.mfi_name,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None
        }

@app.route('/api/unavailable-mfi/status', methods=['POST'])
def update_mfi_status():
    try:
        data = request.get_json()
        mfi_name = data.get('MFI')
        new_status = data.get('Status')
        if not mfi_name or not new_status:
            return jsonify({'error': 'MFI name and Status are required'}), 400
        mfi = Biller.query.filter_by(name=mfi_name, category='MFI').first()
        if not mfi:
            return jsonify({'error': 'MFI not found'}), 404
        old_status = mfi.status
        mfi.status = new_status
        db.session.commit()
        # Record the status change in database (history)
        status_history = MFIStatusHistory(
            mfi_name=mfi_name,
            old_status=old_status,
            new_status=new_status
        )
        db.session.add(status_history)
        db.session.commit()
        # Get updated dashboard counts if status changed to/from 'go_live'
        dashboard_data = None
        if new_status == 'go_live' or old_status == 'go_live':
            total_billers = db.session.query(Biller).count()
            unavailable_isp = db.session.query(Biller).filter_by(category='ISP').filter(Biller.status != 'go_live').count()
            unavailable_mfi = db.session.query(Biller).filter_by(category='MFI').filter(Biller.status != 'go_live').count()
            last_updated = db.session.query(db.func.max(Biller.onboard_date)).scalar()
            dashboard_data = {
                'target_count': total_billers,
                'unavailable_isp': unavailable_isp,
                'unavailable_mfi': unavailable_mfi,
                'last_updated': last_updated.isoformat() if last_updated else None
            }
        return jsonify({
            'success': True,
            'message': f'Status updated for MFI: {mfi_name}',
            'history': status_history.to_dict(),
            'dashboard': dashboard_data
        })
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}', exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/biller-status')
def get_biller_status():
    category = request.args.get('category')
    query = db.session.query(Biller)
    
    if category and category.lower() != 'all':
        query = query.filter_by(category=category)
    
    status_counts = {
        'not_started': query.filter_by(status='not_started').count(),
        'in_progress': query.filter_by(status='in_progress').count(),
        'go_live': query.filter_by(status='go_live').count()
    }
    
    return jsonify(status_counts)

@app.route('/api/top-50-status')
def get_top_50_status():
    try:
        category = request.args.get('category')
        query = Biller.query.filter_by(is_top_50=True)
        if category and category.lower() != 'all':
            query = query.filter(Biller.category.ilike(category))
        billers = query.all()
        status_counts = {
            'not_started': 0,
            'in_progress': 0,
            'go_live': 0
        }
        for b in billers:
            if b.status in status_counts:
                status_counts[b.status] += 1
        return jsonify(status_counts)
    except Exception as e:
        logger.error(f'Error in get_top_50_status: {e}')
        return jsonify({'not_started': 0, 'in_progress': 0, 'go_live': 0}), 500

@app.route('/api/categories')
def get_categories():
    categories = db.session.query(Biller.category).distinct().all()
    return jsonify(['all'] + [category[0] for category in categories])

@app.route('/api/billers')
def get_billers():
    try:
        print('Checking database location:', app.instance_path)
        print('Database URI:', app.config['SQLALCHEMY_DATABASE_URI'])
        total_count = db.session.query(Biller).count()
        print('Total billers in database:', total_count)
        
        # Get a sample of billers to verify data
        sample = db.session.query(Biller).limit(5).all()
        print('Sample billers:')
        for biller in sample:
            print(f'  - {biller.name} ({biller.status})')
        # Get query parameters
        category = request.args.get('category')
        status = request.args.get('status')
        is_top_50 = request.args.get('is_top_50')
        search = request.args.get('search', '').strip()
        
        # Start with base query
        query = db.session.query(Biller)
        
        # Apply filters
        if category and category.lower() != 'all':
            query = query.filter_by(category=category)
        
        if status and status.lower() != 'all':
            query = query.filter_by(status=status)
        
        if is_top_50 and is_top_50.lower() == 'true':
            query = query.filter_by(is_top_50=True)
            
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(Biller.name.ilike(search_pattern))
        
        # Order by name
        query = query.order_by(Biller.name)
        
        billers = query.all()
        return jsonify({
            'success': True,
            'total': len(billers),
            'data': [biller.to_dict() for biller in billers]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/billers/<int:biller_id>/status', methods=['POST'])
def update_biller_status(biller_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
            
        if new_status not in ['not_started', 'in_progress', 'go_live']:
            return jsonify({
                'success': False,
                'error': 'Invalid status'
            }), 400
        
        biller = db.session.query(Biller).get(biller_id)
        if not biller:
            return jsonify({
                'success': False,
                'error': 'Biller not found'
            }), 404
        
        biller.status = new_status
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': biller.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/unavailable-isp/status', methods=['POST'])
def update_isp_status():
    try:
        data = request.get_json()
        isp_name = data.get('ISP')
        new_status = data.get('Status')
        
        if not isp_name or not new_status:
            return jsonify({'error': 'ISP name and Status are required'}), 400
            
        # Convert status to title case for Excel
        status_mapping = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'go_live': 'Go Live'
        }
        
        if new_status not in status_mapping:
            return jsonify({'error': 'Invalid status'}), 400
        
        excel_status = status_mapping[new_status]
        
        # Read the Excel file
        try:
            df = pd.read_excel(ISP_EXCEL_FILE)
        except Exception as e:
            logger.error(f'Failed to read {ISP_EXCEL_FILE}, trying notisp.xlsx')
            df = pd.read_excel('notisp.xlsx')
            
        df.columns = df.columns.str.strip()
        
        # Find the ISP and update its status
        isp_mask = df['ISP'].astype(str) == str(isp_name)
        if not isp_mask.any():
            return jsonify({'error': 'ISP not found'}), 404
            
        # Get the old status before updating
        old_status = df.loc[isp_mask, 'Status'].iloc[0]
        
        # Update status in Excel
        df.loc[isp_mask, 'Status'] = excel_status
        df.to_excel(ISP_EXCEL_FILE, index=False)

        # Update status in the database as well
        biller = Biller.query.filter_by(name=isp_name, category='ISP').first()
        if biller:
              biller.status = new_status  # Use the API value (e.g., 'not_started')
              db.session.commit()
        else:
              logger.warning(f"No Biller found in DB for ISP '{isp_name}' with category 'ISP'")

        # Record the status change in database (history)
        status_history = ISPStatusHistory(
            isp_name=isp_name,
            old_status=old_status,
            new_status=excel_status
        )
        db.session.add(status_history)
        db.session.commit()
        
        # Get updated dashboard counts if status changed to/from 'Go Live'
        dashboard_data = None
        if excel_status == 'Go Live' or old_status == 'Go Live':
            # Get fresh dashboard data since counts have changed
            total_billers = db.session.query(Biller).count()
            unavailable_isp = len(df[df['Status'] != 'Go Live'])
            # Count MFIs that are not in 'Go Live' status from Excel file
            try:
                df_mfi = pd.read_excel('mfi.xlsx')
                unavailable_mfi = len(df_mfi[df_mfi['Status'] != 'Go Live'])
            except Exception as e:
                logger.error(f'Error counting unavailable MFIs: {e}')
                unavailable_mfi = 0
            last_updated = db.session.query(db.func.max(Biller.onboard_date)).scalar()
            
            dashboard_data = {
                'target_count': total_billers,
                'unavailable_isp': unavailable_isp,
                'unavailable_mfi': unavailable_mfi,
                'last_updated': last_updated.isoformat() if last_updated else None
            }
        
        return jsonify({
            'success': True,
            'message': f'Status updated for ISP: {isp_name}',
            'history': status_history.to_dict(),
            'dashboard': dashboard_data  # Will be None if no dashboard update needed
        })
        
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-isp/status: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/unavailable-isp/history', methods=['GET'])
def get_isp_status_history():
    try:
        # Get query parameters
        isp_name = request.args.get('isp')
        
        # Build query
        query = db.session.query(ISPStatusHistory)
        if isp_name:
            query = query.filter(ISPStatusHistory.isp_name == isp_name)
            
        # Order by most recent first
        query = query.order_by(ISPStatusHistory.changed_at.desc())
        
        # Get results
        history = query.all()
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in history]
        })
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-isp/history: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)