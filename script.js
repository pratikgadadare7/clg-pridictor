async function processPDF() {
  const fileInput = document.getElementById("pdfFile");
  const category = document.getElementById("category").value.trim().toUpperCase();
  const percent = parseFloat(document.getElementById("percent").value.trim());
  const department = document.getElementById("department").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>⏳ Reading PDF...</p>";

  if (!fileInput.files.length) {
    alert("Please upload a PDF.");
    return;
  }

  const pdfFile = fileInput.files[0];
  const fileReader = new FileReader();

  fileReader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
    let matched = [];

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      const text = content.items.map(i => i.str).join(" ");
      const lines = text.split(/\\n| {3,}/);

      for (const line of lines) {
        if (line.toUpperCase().includes(category) && line.toLowerCase().includes(department)) {
          const parts = line.trim().split(/\s{2,}/);
          if (parts.length >= 5) {
            try {
              const cutoff = parseFloat(parts[parts.length - 1].replace('%', ''));
              if (!isNaN(cutoff) && percent >= cutoff) {
                matched.push({
                  name: parts[0],
                  branch: parts[1],
                  code: parts[2],
                  category: category,
                  cutoff: cutoff
                });
              }
            } catch {}
          }
        }
      }
    }

    if (matched.length === 0) {
      resultsDiv.innerHTML = "<p>❌ No matching colleges found.</p>";
      return;
    }

    let html = "<table border='1'><tr><th>Institute</th><th>Branch</th><th>CAP Code</th><th>Category</th><th>Cutoff</th></tr>";
    matched.forEach(clg => {
      html += `<tr>
        <td>${clg.name}</td>
        <td>${clg.branch}</td>
        <td>${clg.code}</td>
        <td>${clg.category}</td>
        <td>${clg.cutoff}</td>
      </tr>`;
    });
    html += "</table>";
    resultsDiv.innerHTML = html;
  };

  fileInput.disabled = true;
  fileReader.readAsArrayBuffer(pdfFile);
}
