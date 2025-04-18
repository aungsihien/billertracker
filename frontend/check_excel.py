import pandas as pd
import os

file_path = 'notisp.xlsx'
print(f'Current directory: {os.getcwd()}')
print(f'File exists: {os.path.exists(file_path)}')

if os.path.exists(file_path):
    try:
        df = pd.read_excel(file_path)
        print('\nDataFrame head:')
        print(df.head())
        print('\nColumns:', df.columns.tolist())
    except Exception as e:
        print(f'Error reading Excel file: {str(e)}')
else:
    print('File not found')