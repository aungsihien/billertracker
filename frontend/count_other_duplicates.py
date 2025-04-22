from app import db, app, Biller

with app.app_context():
    # Find billers where category is 'Other'
    duplicates = Biller.query.filter(Biller.category == 'Other').all()
    count = 0
    for biller in duplicates:
        # Only count if there is another with the same name and a different category
        if Biller.query.filter(Biller.name == biller.name, Biller.category != 'Other').first():
            count += 1
    print(f"There are {count} remaining duplicates in category 'Other' (with a same-name, different-category counterpart).")
    print(f"Total 'Other' category records: {len(duplicates)}")
