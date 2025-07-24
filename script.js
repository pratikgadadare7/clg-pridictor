async function processPDF() {
  const fileInput = document.getElementById("pdfFile");
  const categoryInput = document.getElementById("category").value.trim().toUpperCase();
  const percentage = parseFloat(document.getElementById("percent").value);
  const departmentInput = document.getElementById("department").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  if (!fileInput.files.length) {
    alert("Please upload a PDF.");
    return;
  }
  resultsDiv.innerHTML = "<p>⏳ Reading PDF...</p>";

  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

    let matches = [];

    for (let p = 0; p < pdf.numPages; p++) {
      const page = await pdf.getPage(p + 1);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(" ");
      const sections = text.split("Choice Code");

      sections.forEach(sec => {
        // ✅ Extract branch name
        const branchMatch = sec.match(/Course Name\s*:\s*([A-Za-z0-9 &]+)/);
        if (!branchMatch) return;
        const branchName = branchMatch[1].trim();
        if (!branchName.toLowerCase().includes(departmentInput)) return;

        // ✅ Extract college name using pattern ending before "("
        let collegeName = "(Unknown College)";
        const collegeLineMatch = sec.match(/\d{4,}\s+([A-Za-z].*?College.*?)\s*\(/);
        if (collegeLineMatch) {
          collegeName = collegeLineMatch[1].trim();
        }

        // ✅ Extract cutoff categories (e.g. GOPEN, GSEBC...)
        const cats = [...sec.matchAll(/([A-Z]{4,})/g)].map(m => m[1]);

        // ✅ Extract cutoff percentages like (82.54%)
        const cuts = [...sec.matchAll(/\(([\d.]+)%\)/g)].map(m => parseFloat(m[1]));

        // ✅ Match category + cutoff
        cats.forEach((cat, idx) => {
          if (cat === categoryInput && percentage >= (cuts[idx] || 0)) {
            matches.push({
              college: collegeName,
              branch: branchName,
              category: cat,
              cutoff: cuts[idx]
            });
          }
        });
      });
    }

    if (matches.length === 0) {
      resultsDiv.innerHTML = "<p>❌ No matching colleges found.</p>";
      return;
    }

    // ✅ Render result table
    let html = "<table><tr><th>College</th><th>Branch</th><th>Category</th><th>Cutoff %</th></tr>";
    matches.forEach(m => {
      html += `<tr><td>${m.college}</td><td>${m.branch}</td><td>${m.category}</td><td>${m.cutoff}</td></tr>`;
    });
    html += "</table>";
    resultsDiv.innerHTML = html;
  };

  reader.readAsArrayBuffer(fileInput.files[0]);
}
