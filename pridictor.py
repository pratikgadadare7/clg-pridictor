import streamlit as st
import pdfplumber
import pandas as pd
import re

st.set_page_config(page_title="College Predictor", layout="centered")
st.title("🎓 Maharashtra DSE/FE College Predictor By Pratik Gadadare")

st.markdown("""
Upload last year's **CAP PDF**, ente r your **category**, **percentage/rank**, and **desired department** to find suitable colleges.
""")

uploaded_pdf = st.file_uploader("📄 Upload CAP Round PDF", type="pdf")

category = st.text_input("🏷️ Your Category (e.g., GOPEN, GSEBC)").upper()
percent = st.number_input("📊 Your Percentage or Rank", min_value=0.0, max_value=100.0, step=0.01)
department = st.text_input("💡 Desired Department (e.g., Computer, IT, ENTC)").lower()

if uploaded_pdf and category and percent > 0 and department:
    st.info("🔍 Analyzing PDF... please wait.")
    data = []

    with pdfplumber.open(uploaded_pdf) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            lines = text.split("\n")

            for line in lines:
                if category in line and department in line.lower():
                    parts = re.split(r'\s{2,}', line)
                    if len(parts) >= 5:
                        try:
                            cutoff_str = parts[-1].replace('%', '').strip()
                            cutoff = float(cutoff_str) if cutoff_str else 100.0
                            if percent >= cutoff:
                                data.append({
                                    'Institute': parts[0],
                                    'Branch': parts[1],
                                    'CAP Code': parts[2],
                                    'Category': category,
                                    'Last Year Cutoff': cutoff
                                })
                        except:
                            pass

    if data:
        df = pd.DataFrame(data)
        st.success(f"🎯 Found {len(df)} eligible colleges!")
        st.dataframe(df)
        st.download_button("📥 Download as CSV", df.to_csv(index=False), file_name="eligible_colleges.csv")
    else:
        st.warning("❌ No matching colleges found.")
