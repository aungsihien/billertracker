import sqlite3

conn = sqlite3.connect(r'../instance/biller_tracker.db')
cursor = conn.cursor()

print("Tables:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cursor.fetchall())

print("\nBiller count:")
cursor.execute("SELECT COUNT(*) FROM Biller;")
print(cursor.fetchone())

print("\nSample rows from Biller:")
cursor.execute("SELECT * FROM Biller LIMIT 10;")
for row in cursor.fetchall():
    print(row)

conn.close()
