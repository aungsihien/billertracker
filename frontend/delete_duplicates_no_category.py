from app import db, app, Biller

with app.app_context():
    # Find billers where category is 'Other'
    duplicates = Biller.query.filter(Biller.category == 'Other').all()
    deleted = 0
    for biller in duplicates:
        # Only delete if there is another with the same name and a different category
        if Biller.query.filter(Biller.name == biller.name, Biller.category != 'Other').first():
            db.session.delete(biller)
            deleted += 1
    db.session.commit()
    print(f"Deleted {deleted} duplicates in category 'Other'.")
