from app import db, MFIStatusHistory, app

def create_table():
    with app.app_context():
        MFIStatusHistory.__table__.create(db.engine, checkfirst=True)
        print('MFIStatusHistory table created (if it did not exist).')

if __name__ == '__main__':
    create_table()
