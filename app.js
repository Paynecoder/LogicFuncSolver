function buildTable() {
  // Get the placeholder element to display the truth table
  const placeholder = document.getElementById("table-placeholder");
  const mintermHTML = document.getElementById("minterms");
  const maxtermHTML = document.getElementById("maxterms");

  // Get the input expression, trim whitespace, and convert to uppercase
  let expression = document
    .getElementById("function")
    .value.trim()
    .toUpperCase();

  // If the input expression is empty, clear the placeholder and return
  if (!expression) {
    placeholder.innerHTML = "<div></div>";
    mintermHTML.innerHTML = "";
    maxtermHTML.innerHTML = "";
    return;
  }

  // Check for invalid characters in the expression
  if (/[^A-Z01+'()^ ]/.test(expression)) {
    placeholder.innerHTML = "<p>One of the characters is not allowed.</p>";
    return;
  }

  // Add closing parentheses if there are unmatched opening parentheses
  while (
    (expression.match(/\(/g) || []).length >
    (expression.match(/\)/g) || []).length
  ) {
    expression += ")";
  }

  // Extract unique variables from the expression and sort them
  const variables = [...new Set(expression.match(/[A-Z]/g))].sort();

  // Limit the number of variables to 10
  if (variables.length > 10) {
    placeholder.innerHTML = "<p>You can only have 10 variables at a time.</p>";
    return;
  }

  // Start building the HTML for the truth table
  let tableHTML = `<table align='center'><tr><th>minterm</th>${variables
    .map((v) => `<th>${v}</th>`)
    .join("")}<th style="font-style: italic">F</th></tr>`;

  let minTerms = [];
  let maxTerms = [];

  // Generate rows for each possible combination of variable values
  for (let i = 0; i < Math.pow(2, variables.length); i++) {
    // Calculate the binary values for each variable
    const data = variables.map((_, j) => (i >> (variables.length - j - 1)) & 1);
    let equation = expression;

    // Replace variables in the expression with their corresponding values
    variables.forEach((v, idx) => {
      equation = equation.replace(new RegExp(v, "g"), data[idx]);
    });

    // Add the row to the table HTML
    let sol = solve(equation);
    tableHTML += `<tr><td style="letter-spacing: 0">${i}</td>${data
      .map((d) => `<td>${d}</td>`)
      .join("")}<td>${sol}</td></tr>`;
    sol == 1 ? minTerms.push(i) : maxTerms.push(i);
  }

  // Close the table HTML
  tableHTML += "</table>";
  mintermHTML.innerHTML = `Sum of Minterms<br><span>F</span> = &Sigma;<sub>m</sub>(${minTerms.join(
    ", "
  )})`;
  maxtermHTML.innerHTML = `Product of Maxterms<br><span>F</span> = &Pi;<sub>M</sub>(${maxTerms.join(
    ", "
  )})`;

  // Check if the table contains invalid cells and update the placeholder
  placeholder.innerHTML = tableHTML.includes("<td></td>")
    ? "<p>Invalid expression.</p>"
    : tableHTML;
}

function solve(equation) {
  // Recursively solve expressions within parentheses
  while (equation.includes("(")) {
    const start = equation.lastIndexOf("(");
    const end = equation.indexOf(")", start);
    equation =
      equation.substring(0, start) +
      solve(equation.substring(start + 1, end)) +
      equation.substring(end + 1);
  }

  // Simplify double negations and replace negations of 0 and 1
  equation = equation
    .replace(/''/g, "")
    .replace(/0'/g, "1")
    .replace(/1'/g, "0");

  // Add multiplication (*) between consecutive digits
  equation = equation.replace(/(\d)(?=\d)/g, "$1*");

  // Replace XOR operator (^) with JavaScript XOR logic
  equation = equation.replace(/(\d)\^(\d)/g, "($1 ^ $2)");

  // Evaluate the equation and return the result (1 or 0)
  try {
    const result = eval(equation);
    return result ? 1 : 0;
  } catch {
    return "";
  }
}
