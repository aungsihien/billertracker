import pandas as pd
from datetime import datetime
from app import db, app, Biller
import os

# Map Excel files to their categories/types
excel_files = [
    {'file': 'fifty.xlsx', 'category': 'Top 50', 'name_col': 'Biller', 'status_col': 'Status'},
    {'file': 'noti.xlsx', 'category': 'ISP', 'name_col': 'ISP', 'status_col': 'Status'},
    {'file': 'mfi.xlsx', 'category': 'MFI', 'name_col': 'MFI', 'status_col': 'Status'},
    # Add more as needed
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def migrate():
    with app.app_context():
        for excel in excel_files:
            path = os.path.join(BASE_DIR, excel['file'])
            if not os.path.exists(path):
                print(f"File not found: {path}")
                continue
            df = pd.read_excel(path)
            name_col = excel['name_col']
            status_col = excel['status_col']
            category = excel['category']
            for _, row in df.iterrows():
                name = str(row.get(name_col, '')).strip()
                if not name:
                    continue
                status = str(row.get(status_col, 'not_started')).strip().lower().replace(' ', '_')
                # Map status to allowed values
                if status in ['go_live', 'go live']:
                    status = 'go_live'
                elif status in ['in_progress', 'in progress']:
                    status = 'in_progress'
                elif status in ['not_started', 'not started']:
                    status = 'not_started'
                else:
                    status = 'not_started'
                # Check if biller exists
                biller = Biller.query.filter_by(name=name, category=category).first()
                if biller:
                    biller.status = status
                else:
                    biller = Biller(
                        name=name,
                        category=category,
                        status=status,
                        is_top_50=(category == 'Top 50'),
                        onboard_date=datetime.utcnow(),
                        notes=None
                    )
                    db.session.add(biller)
            db.session.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
