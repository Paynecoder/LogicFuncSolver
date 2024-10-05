function buildTable() {
  const placeholder = document.getElementById("table-placeholder");
  const mintermHTML = document.getElementById("minterms");
  const maxtermHTML = document.getElementById("maxterms");

  let expression = document
    .getElementById("function")
    .value.trim()
    .toUpperCase();

  if (!expression) {
    placeholder.innerHTML = "<div></div>";
    mintermHTML.innerHTML = "";
    maxtermHTML.innerHTML = "";
    return;
  }

  if (/[^A-Z01+'()^ ]/.test(expression)) {
    placeholder.innerHTML = "<p>One of the characters is not allowed.</p>";
    return;
  }
  if (
    (expression.match(/\(/g) || []).length !==
    (expression.match(/\)/g) || []).length
  ) {
    placeholder.innerHTML = "<p>Unmatched parentheses in the expression.</p>";
    return;
  }

  if (/\(\s*\)/.test(expression)) {
    placeholder.innerHTML = "<p>Empty parentheses are not allowed.</p>";
    return;
  }

  const variables = [...new Set(expression.match(/[A-Z]/g))].sort();

  if (variables.length > 10) {
    placeholder.innerHTML = "<p>You can only have 10 variables at a time.</p>";
    return;
  }

  let tableHTML = `<table align='center'><tr><th>min</th>${variables
    .map((v) => `<th>${v}</th>`)
    .join("")}<th style="font-style: italic">F</th></tr>`;

  let minTerms = [];
  let maxTerms = [];

  for (let i = 0; i < Math.pow(2, variables.length); i++) {
    const data = variables.map((_, j) => (i >> (variables.length - j - 1)) & 1);
    let equation = expression;

    variables.forEach((v, idx) => {
      equation = equation.replace(new RegExp(v, "g"), data[idx]);
    });

    const isDarkMode = document.body.classList.contains("dark-mode");
    const oddr =
      i % 2 === 1
        ? `style="background-color: ${isDarkMode ? "#444" : "#e9ecef"};"`
        : "";

    let sol = solve(equation);
    tableHTML += `<tr ${oddr}><td style="letter-spacing: 0">${i}</td>${data
      .map((d) => `<td>${d}</td>`)
      .join("")}<td>${sol}</td></tr>`;
    sol == 1 ? minTerms.push(i) : maxTerms.push(i);
  }

  tableHTML += "</table>";
  mintermHTML.innerHTML = `
  <div style="font-weight: 500">Sum of Minterms:</div>
  <div style="margin-top: 10px;"><span>F</span> = &Sigma; (${minTerms.join(
    ", "
  )})</div>
  `;

  maxtermHTML.innerHTML = `
  <div style="font-weight: 500">Product of Maxterms:</div>
  <div style="margin-top: 10px;"><span>F</span> = &Pi; (${maxTerms.join(
    ", "
  )})</div>
  `;

  placeholder.innerHTML = tableHTML.includes("<td></td>")
    ? "<p>Invalid expression.</p>"
    : tableHTML;
}

function solve(equation) {
  while (equation.includes("(")) {
    const start = equation.lastIndexOf("(");
    const end = equation.indexOf(")", start);
    equation =
      equation.substring(0, start) +
      solve(equation.substring(start + 1, end)) +
      equation.substring(end + 1);
  }

  equation = equation
    .replace(/''/g, "")
    .replace(/0'/g, "1")
    .replace(/1'/g, "0");

  equation = equation.replace(/(\d)(?=\d)/g, "$1*");

  equation = equation.replace(/(\d)\^(\d)/g, "($1 ^ $2)");

  try {
    const result = eval(equation);
    return result ? 1 : 0;
  } catch {
    return "";
  }
}

const toggleButton = document.getElementById("dark-mode-toggle");
const body = document.body;

toggleButton.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  toggleButton.textContent = body.classList.contains("dark-mode")
    ? "Light Mode"
    : "Dark Mode";
  buildTable();
});
