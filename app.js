function buildTable() {
  const placeholder = document.getElementById("table-placeholder");
  const mintermHTML = document.getElementById("minterms");
  const maxtermHTML = document.getElementById("maxterms");
  const expressionInput = document.getElementById("function").value.trim().toUpperCase();

  if (!expressionInput) {
    clearResults(placeholder, mintermHTML, maxtermHTML);
    return;
  }

  if (!isValidExpression(expressionInput)) {
    placeholder.innerHTML = "<p>Invalid characters or unmatched parentheses in the expression.</p>";
    return;
  }

  const variables = [...new Set(expressionInput.match(/[A-Z]/g))].sort();
  if (variables.length > 10) {
    placeholder.innerHTML = "<p>You can only have 10 variables at a time.</p>";
    return;
  }

  const [tableHTML, minTerms, maxTerms] = generateTable(expressionInput, variables);
  placeholder.innerHTML = tableHTML || "<p>Invalid expression.</p>";
  mintermHTML.innerHTML = getMintermHTML(minTerms);
  maxtermHTML.innerHTML = getMaxtermHTML(maxTerms);
}

function clearResults(placeholder, mintermHTML, maxtermHTML) {
  placeholder.innerHTML = "<div></div>";
  mintermHTML.innerHTML = "";
  maxtermHTML.innerHTML = "";
}

function isValidExpression(expression) {
  const hasInvalidCharacters = /[^A-Z01+'()^ ]/.test(expression);
  const hasUnmatchedParentheses = (expression.match(/\(/g) || []).length !== (expression.match(/\)/g) || []).length;
  const hasEmptyParentheses = /\(\s*\)/.test(expression);
  return !(hasInvalidCharacters || hasUnmatchedParentheses || hasEmptyParentheses);
}

function generateTable(expression, variables) {
  let tableHTML = `<table align='center'><tr><th>min</th>${variables.map(v => `<th>${v}</th>`).join("")}<th style="font-style: italic">F(${variables.map(v => `${v}`).join("")})</th></tr>`;
  let minTerms = [];
  let maxTerms = [];

  for (let i = 0; i < (1 << variables.length); i++) {
    const data = variables.map((_, j) => (i >> (variables.length - j - 1)) & 1);
    const substitutedExpression = substituteVariables(expression, variables, data);
    const solution = solve(substitutedExpression);

    const isDarkMode = document.body.classList.contains("dark-mode");
    const rowStyle = i % 2 === 1 ? `style="background-color: ${isDarkMode ? "#444" : "#e9ecef"};"` : "";

    tableHTML += `<tr ${rowStyle}><td style="letter-spacing: 0">${i}</td>${data.map(d => `<td>${d}</td>`).join("")}<td>${solution}</td></tr>`;
    solution == 1 ? minTerms.push(i) : maxTerms.push(i);
  }

  tableHTML += "</table>";
  return [tableHTML, minTerms, maxTerms];
}

function substituteVariables(expression, variables, data) {
  return variables.reduce((exp, v, idx) => exp.replace(new RegExp(v, "g"), data[idx]), expression);
}

function solve(equation) {
  while (equation.includes("(")) {
    const start = equation.lastIndexOf("(");
    const end = equation.indexOf(")", start);
    equation = equation.substring(0, start) + solve(equation.substring(start + 1, end)) + equation.substring(end + 1);
  }

  equation = equation.replace(/''/g, "").replace(/0'/g, "1").replace(/1'/g, "0");
  equation = equation.replace(/(\d)(?=\d)/g, "$1*").replace(/(\d)\^(\d)/g, "($1 ^ $2)");

  try {
    return eval(equation) ? 1 : 0;
  } catch {
    return "";
  }
}

function getMintermHTML(minTerms) {
  return `
    <div style="font-weight: 500">Sum of Minterms:</div>
    <div style="margin-top: 10px;"><span>F</span> = &Sigma; (${minTerms.join(", ")})</div>
  `;
}

function getMaxtermHTML(maxTerms) {
  return `
    <div style="font-weight: 500">Product of Maxterms:</div>
    <div style="margin-top: 10px;"><span>F</span> = &Pi; (${maxTerms.join(", ")})</div>
  `;
}

const toggleButton = document.getElementById("dark-mode-toggle");
toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggleButton.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
  buildTable();
});
