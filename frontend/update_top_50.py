import sqlite3

# List of Top 50 biller names from fifty.xlsx
TOP_50_NAMES = [
    'AU MIT Myanmar University', 'Continuous Learning College', 'Hinthar Education',
    'J-TEST', 'Marcon Language Center', 'Thanlwin Private School', 'Pearl Sanpya IGCSE Boarding School',
    'NELC', 'The Queen', 'Tori Travels', 'YOLO TRAVEL4U', 'ASIAN ROYAL STAR', 'FAMOUS TRAVELLER INTERNATIONAL',
    'JJ EXPRESS', 'ELITE EXPRESS', 'HIGH CLASS EXPRESS', 'MANDALAR MINN EXPRESS', 'MYAT MANDALAR HTUN EXPRESS',
    'ROYAL EXPRESS', 'BEE EXPRESS', 'NINJA VAN', 'Zegobird', 'Remax Online Shop', 'Weint Sein GOLD AND JEWELLERY',
    'AUNG THAMARDI GOLD AND JEWELLERY', 'Sein Nan Daw (Diamonds and Fine Jewellery)',
    'SHWE SAN EAIN Gold and JewellerymBuyy', 'OSC Hospital', 'Pun Hlaing Hospitals', 'SP Bakery Company Limited',
    'MDS Myanmar', 'SAI Cosmetix', 'mBuyy', 'Yangon Door2Door Ltd', 'Adixin Myanmar', 'NTS Mart', 'Jinlong Myanmar',
    'AGD Communications', 'De Heus Myanmar', 'City Mart Holding', 'Pro 1 Global', 'Myint Myint Khin',
    'Myanmar Tea Leaf', 'SOLO Collection', 'Amazing Sportswear', 'Myanmar Golden Rock', 'Win Mobile World',
    'iSure', 'mDrive', 'Mahar Mobile'
]

conn = sqlite3.connect(r'../instance/biller_tracker.db')
cursor = conn.cursor()

updated = 0
for name in TOP_50_NAMES:
    cursor.execute("UPDATE Biller SET is_top_50=1, category='Top 50' WHERE name=?", (name,))
    updated += cursor.rowcount
conn.commit()
conn.close()
print(f"Updated {updated} Top 50 billers.")
