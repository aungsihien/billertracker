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

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'status': self.status,
            'is_top_50': self.is_top_50,
            'onboard_date': self.onboard_date.isoformat() if self.onboard_date else None,
            'notes': self.notes
        }

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/api/dashboard-overview')
def get_dashboard_overview():
    total_billers = db.session.query(Biller).count()
    # Count unavailable ISP from Excel file (excluding Go Live ISPs)
    try:
        # Try reading from noti.xlsx first
        try:
            df = pd.read_excel(ISP_EXCEL_FILE)
        except Exception as e:
            logger.error(f'Failed to read {ISP_EXCEL_FILE}, trying notisp.xlsx')
            df = pd.read_excel('notisp.xlsx')
            
        # Only count ISPs that are not in 'Go Live' status
        unavailable_isp = len(df[df['Status'] != 'Go Live'])
    except Exception as e:
        logger.error(f'Error counting unavailable ISPs: {e}')
        unavailable_isp = 0
        
    # Count MFIs that are not in 'Go Live' status from Excel file
    try:
        mfi_excel_path = os.path.join(BASE_DIR, 'mfi.xlsx')
        df_mfi = pd.read_excel(mfi_excel_path)
        unavailable_mfi = len(df_mfi[df_mfi['Status'] != 'Go Live'])
    except Exception as e:
        logger.error(f'Error counting unavailable MFIs: {e}')
        unavailable_mfi = 0
    # Get the last updated timestamp
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
        excel_path = os.path.join(os.path.dirname(__file__), 'fifty.xlsx')
        logger.info(f'Reading Top 50 Billers Excel file from: {excel_path}')
        
        if not os.path.exists(excel_path):
            logger.error(f'Excel file not found: {excel_path}')
            return jsonify([]), 200
            
        df = pd.read_excel(excel_path)
        df.columns = df.columns.str.strip()
        logger.info(f'DataFrame shape: {df.shape}')
        logger.info(f'DataFrame columns: {df.columns.tolist()}')
        
        # Rename columns to match expected format
        df = df.rename(columns={'Biller Name': 'Biller'})
        df['Web'] = ''
        df['Category'] = 'Other'
        
        # Ensure required columns exist
        required_columns = ['Biller', 'Web', 'Status', 'Category']
        for col in required_columns:
            if col not in df.columns:
                logger.error(f'Required column {col} not found in Excel file')
                return jsonify({'error': f'Required column {col} not found in Excel file'}), 500
        
        # Convert DataFrame to list of dictionaries with required fields
        df = df[required_columns]  # Only keep required columns
        biller_data = df.to_dict(orient='records')
        
        # Ensure proper data format and handle missing values
        for row in biller_data:
            if pd.isna(row['Biller']):
                row['Biller'] = ''
            if pd.isna(row['Status']) or not row['Status']:
                row['Status'] = 'Not Started'
            
            # Convert all fields to string to ensure consistent format
            row['Biller'] = str(row['Biller'])
            row['Web'] = str(row['Web'])
            
            # Convert status to the format expected by frontend (lowercase with underscores)
            status_mapping = {
                'Not Started': 'not_started',
                'In Progress': 'in_progress',
                'Go Live': 'go_live'
            }
            # Default to not_started if status doesn't match any known format
            row['Status'] = status_mapping.get(str(row['Status']), 'not_started')
            row['Category'] = str(row['Category'])
        
        logger.info(f'Processed Top 50 Biller data sample: {biller_data[:5]}')
        return jsonify(biller_data)
    except FileNotFoundError:
        logger.error('fifty.xlsx not found')
        return jsonify([]), 200
    except Exception as e:
        logger.error(f'Exception in /api/top-50-billers: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/top-50-billers/status', methods=['POST'])
def update_top_50_biller_status():
    try:
        data = request.get_json()
        logger.info(f"Received data for status update: {data}")
        biller_name = data.get('Biller')
        new_status = data.get('Status')

        logger.info(f"Attempting to update status for biller: '{biller_name}' to '{new_status}'")

        if not biller_name or not new_status:
            logger.error(f"Missing required fields: biller_name={biller_name}, new_status={new_status}")
            return jsonify({'error': 'Biller name and status are required'}), 400

        # Read the Excel file with error handling
        excel_path = os.path.join(os.path.dirname(__file__), 'fifty.xlsx')
        try:
            df = pd.read_excel(excel_path)
        except Exception as e:
            logger.error(f"Failed to read Excel file: {str(e)}")
            return jsonify({'error': 'Could not read biller data file'}), 500

        # Normalize data
        df.columns = df.columns.str.strip()
        
        # Check required columns
        required_columns = ['Biller Name', 'Status']
        for col in required_columns:
            if col not in df.columns:
                logger.error(f"Missing required column: {col}")
                return jsonify({'error': f'Missing {col} column in data'}), 400

        # Clean data
        df['Biller Name'] = df['Biller Name'].astype(str).str.strip()
        df['Status'] = df['Status'].astype(str).str.strip()

        # Find biller (case insensitive)
        biller_mask = df['Biller Name'].str.lower() == biller_name.lower()
        if not biller_mask.any():
            return jsonify({'error': 'Biller not found'}), 404

        # Validate status
        valid_statuses = ['not_started', 'in_progress', 'go_live']
        status_display = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'go_live': 'Go Live'
        }
        
        if new_status not in valid_statuses:
            logger.error(f"Invalid status value: {new_status}. Valid values are: {valid_statuses}")
            return jsonify({'error': 'Invalid status value'}), 400
            
        # Convert from frontend value to display value for Excel
        excel_status = status_display[new_status]

        # Update status
        old_status = df.loc[biller_mask, 'Status'].values[0]
        df.loc[biller_mask, 'Status'] = excel_status
        
        # Log the update for debugging
        logger.info(f"Updated status for '{biller_name}' from '{old_status}' to '{excel_status}'")

        # Save changes
        try:
            df.to_excel(excel_path, index=False)
        except Exception as e:
            logger.error(f"Failed to save Excel file: {str(e)}")
            return jsonify({'error': 'Could not save updates'}), 500

        # Prepare dashboard data
        status_counts = {
            'total': len(df),
            'not_started': len(df[df['Status'] == 'Not Started']),
            'in_progress': len(df[df['Status'] == 'In Progress']),
            'go_live': len(df[df['Status'] == 'Go Live'])
        }
        
        logger.info(f"Status counts after update: {status_counts}")

        return jsonify({
            'success': True,
            'message': 'Status updated successfully',
            'dashboard': status_counts,
            'old_status': old_status,
            'new_status': new_status
        })

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/unavailable-isp', methods=['GET'])
def get_unavailable_isp():
    try:
        logger.info(f'Reading ISP Excel file from: {ISP_EXCEL_FILE}')
        df = pd.read_excel(ISP_EXCEL_FILE)
        df.columns = df.columns.str.strip()
        logger.info(f'DataFrame shape: {df.shape}')
        logger.info(f'DataFrame columns: {df.columns.tolist()}')
        
        # Ensure required columns exist
        required_columns = ['ISP', 'Web', 'Status']
        for col in required_columns:
            if col not in df.columns:
                logger.error(f'Required column {col} not found in Excel file')
                return jsonify({'error': f'Required column {col} not found in Excel file'}), 500
        
        # Convert DataFrame to list of dictionaries with required fields
        df = df[required_columns]  # Only keep required columns
        isp_data = df.to_dict(orient='records')
        
        # Ensure proper data format and handle missing values
        for row in isp_data:
            if pd.isna(row['ISP']):
                row['ISP'] = ''
            if pd.isna(row['Web']):
                row['Web'] = ''
            if pd.isna(row['Status']) or not row['Status']:
                row['Status'] = 'Not Started'
            
            # Convert all fields to string to ensure consistent format
            row['ISP'] = str(row['ISP'])
            row['Web'] = str(row['Web'])
            row['Status'] = str(row['Status'])
        
        logger.info(f'Processed ISP data sample: {isp_data[:5]}')
        return jsonify(isp_data)
    except FileNotFoundError:
        logger.error('noti.xlsx not found')
        return jsonify([]), 200
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-isp: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/unavailable-mfi', methods=['GET'])
def get_unavailable_mfi():
    try:
        # Use the same BASE_DIR as other functions for consistency
        mfi_excel_path = os.path.join(BASE_DIR, 'mfi.xlsx')
        logger.info(f'Reading MFI Excel file from: {mfi_excel_path}')
        df = pd.read_excel(mfi_excel_path)
        df.columns = df.columns.str.strip()
        logger.info(f'DataFrame shape: {df.shape}')
        logger.info(f'DataFrame columns: {df.columns.tolist()}')
        
        # Ensure required columns exist
        required_columns = ['MFI', 'Web', 'Status']
        for col in required_columns:
            if col not in df.columns:
                logger.error(f'Required column {col} not found in Excel file')
                return jsonify({'error': f'Required column {col} not found in Excel file'}), 500
        
        # Convert DataFrame to list of dictionaries with required fields
        df = df[required_columns]  # Only keep required columns
        mfi_data = df.to_dict(orient='records')
        
        # Ensure proper data format and handle missing values
        for row in mfi_data:
            if pd.isna(row['MFI']):
                row['MFI'] = ''
            if pd.isna(row['Web']):
                row['Web'] = ''
            if pd.isna(row['Status']) or not row['Status']:
                row['Status'] = 'Not Started'
            
            # Convert all fields to string to ensure consistent format
            row['MFI'] = str(row['MFI'])
            row['Web'] = str(row['Web'])
            
            # Convert status to lowercase with underscores format for frontend
            status_mapping = {
                'Not Started': 'not_started',
                'In Progress': 'in_progress',
                'Go Live': 'go_live'
            }
            # Default to not_started if status doesn't match any known format
            row['Status'] = status_mapping.get(str(row['Status']), 'not_started')
        
        logger.info(f'Processed MFI data sample: {mfi_data[:5]}')
        return jsonify(mfi_data)
    except FileNotFoundError:
        logger.error(f'MFI Excel file not found at: {mfi_excel_path}')
        return jsonify([]), 200
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-mfi: {e}')
        return jsonify({'error': str(e)}), 500
@app.route('/api/unavailable-mfi/status', methods=['POST'])
def update_mfi_status():
    try:
        data = request.get_json()
        mfi_name = data.get('MFI')
        new_status = data.get('Status')
        
        if not mfi_name or not new_status:
            return jsonify({'error': 'MFI name and Status are required'}), 400
            
        # Convert status from frontend format to Excel format
        status_mapping = {
            "not_started": "Not Started",
            "in_progress": "In Progress",
            "go_live": "Go Live"
        }
        
        logger.info(f"Received status from frontend: '{new_status}'")
        
        if new_status not in status_mapping:
            logger.error(f"Invalid status value: '{new_status}'. Valid values are: {list(status_mapping.keys())}")
            return jsonify({'error': 'Invalid status value'}), 400
        
        excel_status = status_mapping[new_status]
        
        # Read the Excel file
        try:
            mfi_excel_path = os.path.join(BASE_DIR, 'mfi.xlsx')
            logger.info(f'Reading MFI Excel file from: {mfi_excel_path}')
            df = pd.read_excel(mfi_excel_path)
            df.columns = df.columns.str.strip()
            
            # Find the MFI and update its status
            mfi_mask = df['MFI'].astype(str) == str(mfi_name)
            if not mfi_mask.any():
                return jsonify({'error': 'MFI not found'}), 404
                
            # Get the old status before updating
            old_status = df.loc[mfi_mask, 'Status'].iloc[0]
            
            # Update status in Excel
            df.loc[mfi_mask, 'Status'] = excel_status
            df.to_excel(mfi_excel_path, index=False)
            logger.info(f'Updated MFI status in Excel file: {mfi_excel_path}')
            
            # Get updated dashboard counts if status changed to/from 'Go Live'
            dashboard_data = None
            if excel_status == 'Go Live' or old_status == 'Go Live':
                # Get fresh dashboard data since counts have changed
                total_billers = db.session.query(Biller).count()
                unavailable_isp = len(pd.read_excel(ISP_EXCEL_FILE)[pd.read_excel(ISP_EXCEL_FILE)['Status'] != 'Go Live'])
                unavailable_mfi = len(df[df['Status'] != 'Go Live'])
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
                'dashboard': dashboard_data  # Will be None if no dashboard update needed
            })
        except Exception as e:
            logger.error(f'Failed to read or update MFI Excel file {mfi_excel_path}: {e}')
            return jsonify({'error': 'Failed to read or update MFI data'}), 500
            
    except Exception as e:
        logger.error(f'Exception in /api/unavailable-mfi/status: {e}')
        return jsonify({'error': str(e)}), 500

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
        excel_path = os.path.join(os.path.dirname(__file__), 'fifty.xlsx')
        logger.info(f'Reading Top 50 Billers Excel file for status counts from: {excel_path}')
        
        if not os.path.exists(excel_path):
            logger.error(f'Excel file not found: {excel_path}')
            return jsonify({'not_started': 0, 'in_progress': 0, 'go_live': 0}), 200
            
        df = pd.read_excel(excel_path)
        df.columns = df.columns.str.strip()
        
        # Apply category filter if provided
        if category and category.lower() != 'all' and 'Category' in df.columns:
            df = df[df['Category'].str.lower() == category.lower()]
        
        # Define status mappings (both directions)
        status_mapping = {
            # Display format to API format
            'Not Started': 'not_started',
            'In Progress': 'in_progress',
            'Go Live': 'go_live',
            # API format to API format (identity mapping)
            'not_started': 'not_started',
            'in_progress': 'in_progress',
            'go_live': 'go_live'
        }
        
        # Initialize status counts
        status_counts = {
            'not_started': 0,
            'in_progress': 0,
            'go_live': 0
        }
        
        # Ensure Status column exists
        if 'Status' in df.columns:
            # Normalize all status values to API format
            for _, row in df.iterrows():
                status = row['Status']
                if pd.notna(status) and status in status_mapping:
                    normalized_status = status_mapping[status]
                    status_counts[normalized_status] += 1
                elif pd.notna(status):
                    logger.warning(f'Unknown status value in Excel: {status}')
        
        logger.info(f'Top 50 status counts: {status_counts}')
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
        
        # Record the status change in database
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