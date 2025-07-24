from flask import Flask, render_template, request
import os
import pdfplumber
import re

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    category = request.form.get("category", "").upper()
    percent = float(request.form.get("percent", 0))
    department = request.form.get("department", "").lower()

    colleges = []

    # 1️⃣ Parse Uploaded PDF
    pdf_file = request.files.get("pdf")
    if pdf_file and pdf_file.filename.endswith('.pdf'):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
        pdf_file.save(filepath)

        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                lines = page.extract_text().split('\n')
                for line in lines:
                    if category in line and department in line.lower():
                        parts = re.split(r'\s{2,}', line)
                        if len(parts) >= 5:
                            try:
                                cutoff_val = float(parts[-1].replace('%', '').strip())
                                if percent >= cutoff_val:
                                    colleges.append({
                                        "name": parts[0],
                                        "branch": parts[1],
                                        "code": parts[2],
                                        "category": category,
                                        "cutoff": cutoff_val
                                    })
                            except:
                                pass

    # 2️⃣ Parse Manual Inputs
    for i in range(1, 11):  # Limit: 10 entries
        name = request.form.get(f"name_{i}", "")
        branch = request.form.get(f"branch_{i}", "")
        code = request.form.get(f"code_{i}", "")
        cat = request.form.get(f"cat_{i}", "").upper()
        cutoff = request.form.get(f"cutoff_{i}", "")

        if name and cat and cutoff:
            try:
                cutoff = float(cutoff)
                if cat == category and department in branch.lower() and percent >= cutoff:
                    colleges.append({
                        "name": name,
                        "branch": branch,
                        "code": code,
                        "category": cat,
                        "cutoff": cutoff
                    })
            except:
                continue

    return render_template("result.html", colleges=colleges)

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
