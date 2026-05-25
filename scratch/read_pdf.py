import sys
import os

try:
    import pypdf
    print("pypdf is installed")
except ImportError:
    try:
        import PyPDF2 as pypdf
        print("PyPDF2 is installed")
    except ImportError:
        print("Neither pypdf nor PyPDF2 is installed")
        pypdf = None

if pypdf:
    try:
        reader = pypdf.PdfReader("../rapport_pfe__Copy.pdf")
        print(f"Number of pages: {len(reader.pages)}")
        print("\n--- Outline ---")
        outline = reader.outline
        def print_outline(outline_list, depth=0):
            for item in outline_list:
                if isinstance(item, list):
                    print_outline(item, depth + 1)
                else:
                    title = item.get('/Title', 'Unknown')
                    print("  " * depth + f"- {title}")
        if outline:
            print_outline(outline)
        else:
            print("No outline found in the PDF.")
            
        print("\n--- First 2 Pages text preview ---")
        for i in range(min(5, len(reader.pages))):
            print(f"\n--- PAGE {i+1} ---")
            print(reader.pages[i].extract_text()[:1000])
    except Exception as e:
        print("Error reading pdf:", e)
else:
    # Try using pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open("../rapport_pfe__Copy.pdf") as pdf:
            print(f"Number of pages (pdfplumber): {len(pdf.pages)}")
            for i in range(min(3, len(pdf.pages))):
                print(f"--- Page {i+1} ---")
                print(pdf.pages[i].extract_text()[:1000])
    except Exception as e:
        print("pdfplumber error/not installed:", e)
