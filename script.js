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
  reader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

    let matches = [];

    for (let p = 0; p < pdf.numPages; p++) {
      const page = await pdf.getPage(p + 1);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(" ");
      const sections = text.split("Choice Code");

      sections.forEach(sec => {
        // Extract college name & branch
        const header = sec.match(/(\d+)\s+(.+?)\s+Course Name\s*:\s*([A-Za-z0-9 &]+)/);
        if (!header) return;

        const collegeName = header[2].trim();
        const branchName = header[3].trim();
        if (!branchName.toLowerCase().includes(departmentInput)) return;

        // Extract all cutoffs in this block
        // pattern: e.g. 2779 (89.37%)
        const cutoffLines = sec.matchAll(/(\d+)\s*\(\s*([\d.]+)%\s*\)/g);
        const cats = [...sec.matchAll(/([A-Z]{2,5})(?=\s)/g)].map(m => m[1]);
        const cuts = [...cutoffLines].map(m => parseFloat(m[2]));

        // Map by position: cats[0] → cuts[0], cats[1] → cuts[1]
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

    let html = "<table><tr><th>College</th><th>Branch</th><th>Category</th><th>Cutoff %</th></tr>";
    matches.forEach(m => {
      html += `<tr><td>${m.college}</td><td>${m.branch}</td><td>${m.category}</td><td>${m.cutoff}</td></tr>`;
    });
    html += "</table>";
    resultsDiv.innerHTML = html;
  };

  reader.readAsArrayBuffer(fileInput.files[0]);
}
