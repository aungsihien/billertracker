import sys
import os

# Add frontend directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(project_dir, 'frontend')
sys.path.append(frontend_dir)

from app import app, db, Biller
from datetime import datetime
import pandas as pd

def init_db():
    with app.app_context():
        print('Database URI:', app.config['SQLALCHEMY_DATABASE_URI'])
        
        # Create tables
        db.create_all()
        print('Created database tables')
        
        # Clear existing data
        deleted_count = db.session.query(Biller).delete()
        print(f'Cleared {deleted_count} existing records')
        
        try:
            # Read data from Excel file
            excel_path = os.path.join(os.path.dirname(__file__), 'book.xlsx')
            df = pd.read_excel(excel_path)
            
            # Convert Excel data to Biller objects
            billers = []
            for _, row in df.iterrows():
                biller = Biller(
                    name=str(row['Biller Name']),
                    status=str(row['Status']).lower().replace(' ', '_'),
                    category='Other',  # Default category
                    is_top_50=False  # Default value
                )
                billers.append(biller)
            
            # Add all billers to database
            db.session.bulk_save_objects(billers)
            db.session.commit()
            print(f'Successfully imported {len(billers)} billers from Excel')
            
        except Exception as e:
            print(f'Error importing data from Excel: {str(e)}')
            db.session.rollback()
        # Final commit to ensure all changes are saved
        db.session.commit()

if __name__ == '__main__':
    init_db()