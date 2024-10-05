const buildTable = () => {
  const placeholder = document.getElementById("table-placeholder");
  const mintermHTML = document.getElementById("minterms");
  const maxtermHTML = document.getElementById("maxterms");
  const kmapPlaceholder = document.getElementById("kmap-placeholder");
  const expressionInput = document
    .getElementById("function")
    .value.trim()
    .toUpperCase();

  if (!expressionInput) {
    clearResults(placeholder, mintermHTML, maxtermHTML);
    return;
  }

  if (!isValidExpression(expressionInput)) {
    placeholder.innerHTML =
      "<p>Invalid characters or unmatched parentheses in the expression.</p>";
    return;
  }

  const variables = [...new Set(expressionInput.match(/[A-Z]/g))].sort();
  if (variables.length > 10) {
    placeholder.innerHTML = "<p>You can only have 10 variables at a time.</p>";
    return;
  }

  const [tableHTML, minTerms, maxTerms] = generateTable(
    expressionInput,
    variables
  );

  placeholder.innerHTML = tableHTML || "<p>Invalid expression.</p>";
  mintermHTML.innerHTML = getMintermHTML(minTerms);
  maxtermHTML.innerHTML = getMaxtermHTML(maxTerms);
  kmapPlaceholder.innerHTML = generateKMap(minTerms, variables);
};

const clearResults = (placeholder, mintermHTML, maxtermHTML) => {
  placeholder.innerHTML = "<div></div>";
  mintermHTML.innerHTML = "";
  maxtermHTML.innerHTML = "";
  const kmapPlaceholder = document.getElementById("kmap-placeholder");
  if (kmapPlaceholder) kmapPlaceholder.innerHTML = "";
};

const isValidExpression = (expression) => {
  const hasInvalidCharacters = /[^A-Z01+'()^ ]/.test(expression);
  const hasUnmatchedParentheses =
    (expression.match(/\(/g) || []).length !==
    (expression.match(/\)/g) || []).length;
  const hasEmptyParentheses = /\(\s*\)/.test(expression);
  return !(
    hasInvalidCharacters ||
    hasUnmatchedParentheses ||
    hasEmptyParentheses
  );
};

const generateTable = (expression, variables) => {
  let tableHTML = `
    <div style="font-weight: 500; padding: 16px;">Truth Table:</div>
    <table align='center'><tr><th>min</th>${variables
      .map((v) => `<th>${v}</th>`)
      .join("")}<th style="font-style: italic">F(${variables
    .map((v) => `${v}`)
    .join("")})</th></tr>`;

  let minTerms = [];
  let maxTerms = [];

  for (let i = 0; i < 1 << variables.length; i++) {
    const data = variables.map((_, j) => (i >> (variables.length - j - 1)) & 1);
    const substitutedExpression = substituteVariables(
      expression,
      variables,
      data
    );
    const solution = solve(substitutedExpression);

    const isDarkMode = document.body.classList.contains("dark-mode");
    const rowStyle =
      i % 2 === 1
        ? `style="background-color: ${isDarkMode ? "#444" : "#e9ecef"};"`
        : "";

    tableHTML += `<tr ${rowStyle}><td style="letter-spacing: 0">${i}</td>${data
      .map((d) => `<td>${d}</td>`)
      .join("")}<td>${solution}</td></tr>`;
    solution == 1 ? minTerms.push(i) : maxTerms.push(i);
  }

  tableHTML += "</table>";
  return [tableHTML, minTerms, maxTerms];
};

const substituteVariables = (expression, variables, data) =>
  variables.reduce(
    (exp, v, idx) => exp.replace(new RegExp(v, "g"), data[idx]),
    expression
  );

const solve = (equation) => {
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
  equation = equation
    .replace(/(\d)(?=\d)/g, "$1*")
    .replace(/(\d)\^(\d)/g, "($1 ^ $2)");

  try {
    return eval(equation) ? 1 : 0;
  } catch {
    return "";
  }
};

const getMintermHTML = (minTerms) => `
  <div style="font-weight: 500">Sum of Minterms:</div>
  <div style="margin-top: 10px;"><span>F</span> = &Sigma; (${minTerms.join(
    ", "
  )})</div>
`;

const getMaxtermHTML = (maxTerms) => `
  <div style="font-weight: 500">Product of Maxterms:</div>
  <div style="margin-top: 10px;"><span>F</span> = &Pi; (${maxTerms.join(
    ", "
  )})</div>
`;

const toggleButton = document.getElementById("dark-mode-toggle");
toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggleButton.textContent = document.body.classList.contains("dark-mode")
    ? "Light Mode"
    : "Dark Mode";
  buildTable();
});

const generateKMap = (minTerms, variables) => {
  const numVars = variables.length;
  if (numVars < 2 || numVars > 4) {
    return `<p style="padding: 16px;">K-map generation is supported for 2 to 4 variables.</p>`;
  }

  let rowVars = [];
  let colVars = [];
  let rowLabels = [];
  let colLabels = [];
  let kmapMinterms = [];

  if (numVars == 2) {
    rowVars = [variables[0]];
    colVars = [variables[1]];
    rowLabels = ["0", "1"];
    colLabels = ["0", "1"];
    kmapMinterms = [
      [0, 1],
      [2, 3],
    ];
  } else if (numVars == 3) {
    rowVars = [variables[0]];
    colVars = [variables[1], variables[2]];
    rowLabels = ["0", "1"];
    colLabels = ["00", "01", "11", "10"];
    kmapMinterms = [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
    ];
  } else if (numVars == 4) {
    rowVars = [variables[0], variables[1]];
    colVars = [variables[2], variables[3]];
    rowLabels = ["00", "01", "11", "10"];
    colLabels = ["00", "01", "11", "10"];
    kmapMinterms = [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10],
    ];
  }

  let kmapHTML = `
    <div style="font-weight: 500; padding: 16px;">Karnaugh Map:</div>
    <table>`;

  kmapHTML += `<tr><th rowspan="2" colspan="2"></th><th colspan="${
    colLabels.length
  }">${colVars.join("")}</th></tr>`;

  kmapHTML += `<tr>`;
  for (let j = 0; j < colLabels.length; j++) {
    kmapHTML += `<th>${colLabels[j]}</th>`;
  }
  kmapHTML += `</tr>`;

  for (let i = 0; i < rowLabels.length; i++) {
    if (i === 0) {
      kmapHTML += `<tr><th rowspan="${rowLabels.length}">${rowVars.join(
        ""
      )}</th><th>${rowLabels[i]}</th>`;
    } else {
      kmapHTML += `<tr><th>${rowLabels[i]}</th>`;
    }
    for (let j = 0; j < colLabels.length; j++) {
      const mintermIndex = kmapMinterms[i][j];
      const value = minTerms.includes(mintermIndex) ? 1 : 0;
      const isDarkMode = document.body.classList.contains("dark-mode");
      const cellStyle =
        value === 1
          ? `style="background-color: ${isDarkMode ? "#444" : "#e9ecef"};"`
          : "";
      kmapHTML += `<td ${cellStyle}>${value}</td>`;
    }
    kmapHTML += `</tr>`;
  }
  kmapHTML += `</table>`;

  return kmapHTML;
};
