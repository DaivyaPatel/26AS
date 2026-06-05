import pdfplumber

print("--- 26AS SAMPLE ---")
with pdfplumber.open("26 AS FY 24-25.pdf") as pdf:
    for page in pdf.pages[:3]:  # Print first 3 pages
        print(page.extract_text())

print("\n--- TALLY SAMPLE ---")
with pdfplumber.open("DT TDS FY 24-25.pdf") as pdf:
    for page in pdf.pages[:1]:  # Print first page
        print(page.extract_text())