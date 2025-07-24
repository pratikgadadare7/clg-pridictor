let colleges = [];

fetch("colleges.json")
  .then(response => response.json())
  .then(data => colleges = data);

function predict() {
  const category = document.getElementById("category").value.trim().toUpperCase();
  const percent = parseFloat(document.getElementById("percent").value.trim());
  const department = document.getElementById("department").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  const matched = colleges.filter(clg =>
    clg.category.toUpperCase() === category &&
    clg.branch.toLowerCase().includes(department) &&
    percent >= parseFloat(clg.cutoff)
  );

  if (matched.length === 0) {
    resultsDiv.innerHTML = "<p>No matching colleges found.</p>";
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
}
