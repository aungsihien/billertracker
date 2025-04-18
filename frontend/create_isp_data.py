import pandas as pd

# Create sample ISP data
isp_data = {
    'ISP': ['Airtel', 'Jio', 'Vodafone', 'BSNL', 'ACT Fibernet'],
    'Web': ['www.airtel.com', 'www.jio.com', 'www.vodafone.com', 'www.bsnl.co.in', 'www.actcorp.in'],
    'Status': ['Not Started', 'Not Started', 'Not Started', 'Not Started', 'Not Started']
}

# Create DataFrame
df = pd.DataFrame(isp_data)

# Save to Excel file
df.to_excel('notisp.xlsx', index=False)
print('Excel file created successfully')