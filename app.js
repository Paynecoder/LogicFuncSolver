const buildTable = () => {
  const placeholder = document.getElementById("table-placeholder");
  const mintermHTML = document.getElementById("minterms");
  const maxtermHTML = document.getElementById("maxterms");
  const kmapPlaceholder = document.getElementById("kmap-placeholder");
  const sopPlaceholder = document.getElementById("sop-placeholder");
  const expressionInput = document
    .getElementById("function")
    .value.trim()
    .toUpperCase();

  if (!expressionInput) {
    clearResults(
      placeholder,
      mintermHTML,
      maxtermHTML,
      kmapPlaceholder,
      sopPlaceholder
    );
    return;
  }

  if (!isValidExpression(expressionInput)) {
    placeholder.innerHTML =
      "<p>Invalid characters or unmatched parentheses in the expression.</p>";
    mintermHTML.innerHTML = "";
    maxtermHTML.innerHTML = "";
    kmapPlaceholder.innerHTML = "";
    sopPlaceholder.innerHTML = "";
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
  sopPlaceholder.innerHTML = generateSOP(minTerms, variables);
  attachEllipsisListeners(minTerms, maxTerms);
};

const clearResults = (placeholder, mintermHTML, maxtermHTML, kmap, sop) => {
  placeholder.innerHTML = "<div></div>";
  mintermHTML.innerHTML = "";
  maxtermHTML.innerHTML = "";
  if (kmap) {
    kmap.innerHTML = "";
    sop.innerHTML = "";
  }
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
    <div class="scrolltable">
      <table align='center'>
        <tr>
          <th>min</th>
          ${variables.map((v) => `<th>${v}</th>`).join("")}
          <th style="font-style: italic">F()</th>
        </tr>`;

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

const getMintermHTML = (minTerms) => {
  const displayedTerms = minTerms.slice(0, 15);
  const hasMore = minTerms.length > 15;
  const mintermDivId = 'minterm-display';

  const moreSpan = hasMore
    ? `<span id="minterm-ellipsis" style="text-decoration: underline; cursor: pointer;">...</span>`
    : '';
  return `
    <div style="font-weight: 500">Sum of Minterms:</div>
    <div id="${mintermDivId}" style="margin-top: 10px;">
      <span>F</span> = &Sigma; (${displayedTerms.join(", ")}${hasMore ? ', ' : ''}${moreSpan})
    </div>
  `;
};

const getMaxtermHTML = (maxTerms) => {
  const displayedTerms = maxTerms.slice(0, 15);
  const hasMore = maxTerms.length > 15;
  const maxtermDivId = 'maxterm-display';

  const moreSpan = hasMore
    ? `<span id="maxterm-ellipsis" style="text-decoration: underline; cursor: pointer;">...</span>`
    : '';
  return `
    <div style="font-weight: 500">Product of Maxterms:</div>
    <div id="${maxtermDivId}" style="margin-top: 10px;">
      <span>F</span> = &Pi; (${displayedTerms.join(", ")}${hasMore ? ', ' : ''}${moreSpan})
    </div>
  `;
};


const attachEllipsisListeners = (minTerms, maxTerms) => {
  const mintermEllipsis = document.getElementById('minterm-ellipsis');
  if (mintermEllipsis) {
    mintermEllipsis.addEventListener('click', function() {
      const mintermDiv = document.getElementById('minterm-display');
      mintermDiv.innerHTML = `<span>F</span> = &Sigma; (${minTerms.join(", ")})`;
    });
  }
  const maxtermEllipsis = document.getElementById('maxterm-ellipsis');
  if (maxtermEllipsis) {
    maxtermEllipsis.addEventListener('click', function() {
      const maxtermDiv = document.getElementById('maxterm-display');
      maxtermDiv.innerHTML = `<span>F</span> = &Pi; (${maxTerms.join(", ")})`;
    });
  }
};

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

const generateSOP = (minterms, variables) => {
  const numVars = variables.length;
  if (numVars < 2 || numVars > 4) {
    return ``;
  }
  function getBinaryMinterms(minterms, numVariables) {
    return minterms.map((minterm) => {
      let binary = minterm.toString(2).padStart(numVariables, "0");
      return {
        value: [minterm],
        binary: binary,
        combined: false,
      };
    });
  }

  function groupMintermsByOnes(binaryMinterms) {
    const groups = {};
    binaryMinterms.forEach((term) => {
      const onesCount = term.binary
        .split("")
        .filter((bit) => bit === "1").length;
      if (!groups[onesCount]) groups[onesCount] = [];
      groups[onesCount].push(term);
    });
    return groups;
  }

  function getDifference(bin1, bin2) {
    let count = 0;
    let index = -1;
    for (let i = 0; i < bin1.length; i++) {
      if (bin1[i] !== bin2[i]) {
        count++;
        index = i;
      }
    }
    return { count, index };
  }

  function replaceCharAt(str, index, char) {
    return str.substr(0, index) + char + str.substr(index + 1);
  }

  function combineMinterms(groups) {
    const newGroups = {};
    const combinedTerms = [];
    const groupNumbers = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b);
    let isCombined = false;

    for (let i = 0; i < groupNumbers.length - 1; i++) {
      const groupA = groups[groupNumbers[i]];
      const groupB = groups[groupNumbers[i + 1]];

      groupA.forEach((termA) => {
        groupB.forEach((termB) => {
          const diff = getDifference(termA.binary, termB.binary);
          if (diff.count === 1) {
            const combinedBinary = replaceCharAt(termA.binary, diff.index, "-");
            const combinedMinterm = {
              value: [...new Set([...termA.value, ...termB.value])],
              binary: combinedBinary,
              combined: false,
            };
            termA.combined = termB.combined = true;
            if (
              !combinedTerms.some(
                (term) =>
                  term.binary === combinedBinary &&
                  arraysEqual(term.value, combinedMinterm.value)
              )
            ) {
              combinedTerms.push(combinedMinterm);
              const onesCount = combinedBinary
                .split("")
                .filter((bit) => bit === "1").length;
              if (!newGroups[onesCount]) newGroups[onesCount] = [];
              newGroups[onesCount].push(combinedMinterm);
            }
            isCombined = true;
          }
        });
      });
    }
    return { newGroups, combinedTerms, isCombined };
  }

  function arraysEqual(a1, a2) {
    return JSON.stringify(a1.sort()) === JSON.stringify(a2.sort());
  }

  function extractPrimeImplicants(allTerms) {
    const uniqueTerms = [];
    allTerms.forEach((term) => {
      if (
        !uniqueTerms.some((uniqueTerm) => uniqueTerm.binary === term.binary)
      ) {
        uniqueTerms.push(term);
      }
    });
    return uniqueTerms.filter((term) => !term.combined);
  }

  function createPrimeImplicantChart(primeImplicants, minterms) {
    const chart = {};
    minterms.forEach((minterm) => {
      chart[minterm] = [];
      primeImplicants.forEach((pi, index) => {
        if (pi.value.includes(minterm)) {
          chart[minterm].push(index);
        }
      });
    });
    return chart;
  }

  function selectEssentialPrimeImplicants(chart, primeImplicants) {
    const essentialPIs = [];
    const coveredMinterms = new Set();

    for (let minterm in chart) {
      if (chart[minterm].length === 1) {
        const piIndex = chart[minterm][0];
        if (!essentialPIs.includes(piIndex)) {
          essentialPIs.push(piIndex);
          primeImplicants[piIndex].value.forEach((val) =>
            coveredMinterms.add(val)
          );
        }
      }
    }
    for (let minterm of coveredMinterms) {
      delete chart[minterm];
    }

    return { essentialPIs, remainingChart: chart };
  }
  function binaryToExpression(binaryStr, variables) {
    let expressionParts = [];
    for (let i = 0; i < binaryStr.length; i++) {
      if (binaryStr[i] !== "-") {
        expressionParts.push(
          binaryStr[i] === "1" ? variables[i] : variables[i] + "'"
        );
      }
    }
    expressionParts.sort();
    return expressionParts.join("");
  }
  function getFinalExpression(selectedPIs, primeImplicants, variables) {
    const productTerms = selectedPIs.map((piIndex) =>
      binaryToExpression(primeImplicants[piIndex].binary, variables)
    );
    productTerms.sort();
    return productTerms.join(" + ");
  }
  const numVariables = variables.length;
  let binaryMinterms = getBinaryMinterms(minterms, numVariables);
  let groups = groupMintermsByOnes(binaryMinterms);
  let allTerms = binaryMinterms.slice();
  let isCombined;
  do {
    let result = combineMinterms(groups);
    let { newGroups, combinedTerms } = result;
    isCombined = result.isCombined;
    allTerms = allTerms.concat(combinedTerms);
    groups = newGroups;
  } while (Object.keys(groups).length > 0 && isCombined);
  let primeImplicants = extractPrimeImplicants(allTerms);
  let primeImplicantChart = createPrimeImplicantChart(
    primeImplicants,
    minterms
  );
  let { essentialPIs, remainingChart } = selectEssentialPrimeImplicants(
    primeImplicantChart,
    primeImplicants
  );
  let selectedPIs = essentialPIs.slice();
  if (Object.keys(remainingChart).length > 0) {
    const mintermPIs = {};
    for (let minterm in remainingChart) {
      remainingChart[minterm].forEach((piIndex) => {
        if (!mintermPIs[piIndex]) mintermPIs[piIndex] = new Set();
        mintermPIs[piIndex].add(Number(minterm));
      });
    }
    const sortedPIs = Object.entries(mintermPIs).sort(
      (a, b) => b[1].size - a[1].size
    );
    const coveredMinterms = new Set();
    sortedPIs.forEach(([piIndex, mintermSet]) => {
      if ([...mintermSet].some((m) => !coveredMinterms.has(m))) {
        selectedPIs.push(Number(piIndex));
        mintermSet.forEach((m) => coveredMinterms.add(m));
      }
    });
  }
  selectedPIs = [...new Set(selectedPIs)];
  let minimizedExpression = getFinalExpression(
    selectedPIs,
    primeImplicants,
    variables
  );
  let sopHTML = `<div> = ${minimizedExpression}</div>`;
  return sopHTML;
};
