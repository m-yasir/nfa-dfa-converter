//
// GLOBAL VARIABLES FOR THIS FILE ONLY!
//
/** @type {Array} */
let alphabetSet = [],
  states = {};
/** @type {Boolean} */
let isError = false;
/** @type {Object} */
let dfaTable = {};
/** END */
let initial = "",
  finalStates = [];

//
//  EVENT LISTENERS START
//

// Registering ALPHABET SET Event listener on enter
$("#setInput").on(
  "keyup",
  /** @param {Event} e */
  e => {
    e.preventDefault();
    if (e.which === 13) {
      addAlphabets(e);
    }
  }
);

$("#statesInput").on(
  "keyup",
  /** @param {Event} e */
  e => {
    e.preventDefault();
    if (e.which === 13) {
      handleStateInput(e);
    }
  }
);

$("#statesInput").on(
  "input",
  /** @param {Event} e */
  e => {
    e.target.value = e.target.value.replace(/ +/g, "");
  }
);

$("#initialField").on("input", e => {
  initial = e.target.value;
});

$("#finalField").on("input", e => {
  finalStates = e.target.value.split(" ");
});

/**
 * @param {Event} e 
 */
function handleFiInput(e) {
  e.target.value = replaceByFi(e.target.value);
}

//
// ***** EVENT HANDLERS END *****
//

// TODO: check for empty string and put Fi/N automatically ?

/**
 * @returns {Array<String>} returns array of states' keys
 */
function processNFA() {
  let statesArr = Object.keys(states);
  for (let i = 0; i < statesArr.length; i++) {
    states[statesArr[i]] = [];
    for (let j = 0; j < alphabetSet.length; j++) {
      states[statesArr[i]][j] = $(`#${statesArr[i]}-${j}`)
        .val()
        .trim()
        .split(" ");
    }
  }
  return statesArr;
}

/**
 * 
 * @param {Array<String>} dfaStates
 * @returns {void} 
 */
function generateDFATable(dfaStates = []) {
  if (!dfaStates.length) return;
  const tBody = $("#dfaTbody");
  $("#dfaTable").css("display", "table");
  alphabetSet.forEach(el => {
    $("#dfaHeader").append(`<th>δ(Q , ${el})</th>`);
  });
  for (let key in dfaTable) {
    tBody.html(
      (i, origHTML) =>
        origHTML +
        `
      <tr>
        <td>{ ${key} }</td>
        ${getDFAcells(dfaTable[key])}
      </tr>
      `
    );
  }
  /** @type {Array<Array<String>>} */
  const fStates = [];
  dfaStates.forEach(el => {
    let arr = el.trim().split(",");
    if (arr.length && isSubset(arr, finalStates) || isSubset(finalStates, arr)) {
      fStates.push(`{ ${arr} }`);
    }
  });
  // TODO: Better Fi state handling
  $("#dfaInfo").html(`
  <label class="label"><b>Initial State:</b> </label><p style="display: inline; margin: 10px;">{ ${initial} }</p><br />
  <label class="label"><b>Final States:</b> </label><p style="display: inline; margin: 10px;">${fStates.length ? "[ " + fStates.reduce((a,b) => a + ", " + b) + " ]" : "None"}</p>
  `);
}

/**
 * @param {Array<Array<String>>} stateTransitions
 * @returns {String} - string contains HTML Elements namely "td"s
 */
function getDFAcells(stateTransitions = []) {
  let result = "";
  stateTransitions.forEach(el => {
    result += `<td>{${el}}</td>`;
  });
  return result;
}

// TODO: Determine why there's one extra iteration after all states are added?
// TODO: Add Support for Lambda/Epsilon Transition Tables
// TODO: Break Conversion into related functions/procedures
//             ______
//            |     |
//            |     |
//          _|     |_
//          \       /
//          \     /
//          \   /
//          \ /
//          \/
/**         
 * The Actual function that contains the logic to convert an NFA table to DFA :)
 * @returns {void}
 */
function convertToDFA() {
  if (!initial || !finalStates.length) {
    alert("Please set initial and finalStates");
    return;
  }
  const statesArr = processNFA();
  // copy first transition
  dfaTable[[statesArr[0]]] = states[statesArr[0]];
  // setup a set to be used for unions
  /** @type {Set} */
  let rSet = new Set();

  /** @type {Boolean} a boolean variable to break */
  let isInsert = false, lastLength = -1;

  let keys = null, key = null;
  do {
    keys = Object.keys(dfaTable);
    key = dfaTable[keys[keys.length - 1]];
    isInsert = false;
    for (let j = 0; j < alphabetSet.length; j++) {
      if (dfaTable[key[j]] || key[j].includes("Φ")) continue;
      isInsert = true;
      dfaTable[key[j]] = [];
      for (let z = 0; z < alphabetSet.length; z++) {
        rSet.clear();
        for (let k = 0, item = null; k < key[j].length; k++) {
          item = key[j][k];
          let tempState = states[item];
          for (let x = 0; x < tempState[z].length; x++) {
            if (tempState[z][x] === "Φ") continue;
            rSet.add(tempState[z][x]);
          }
        }
        let arr = [...rSet];
        dfaTable[key[j]].push(arr.sort());
      }
    }
  } while (isInsert);
  generateDFATable(keys);
  console.log(dfaTable);
}

function hasKeys(key) {
  return false;
}

/**
 * @param {Event} e
 */
addAlphabets = e => {
  let inp = $("#setInput").val();
  if (!inp) return;
  $("#alphabetForm").hide();
  $("#container")
    .show()
    .css("display", "block");
  alphabetSet.push(...inp.split(" "));
  appendAlphabets(alphabetSet);
};

/**
 *
 * @param {Event} e
 * @returns {void}
 */
function handleStateInput() {
  const field = $("#statesInput"),
    value = field.val().trim();
  if (!value || states[value]) return;
  addStates(value);
  if (value) states[value] = [];
  field.val("");
}

function clearNFATable() {
  $("tr").remove(".transition");
}

function generateStatesTable(states) {
  states.forEach(el => {
    addStates(el);
  });
}

/**
 *
 * @param {String} state
 * @returns {void}
 */
function addStates(state) {
  $("#nfaTbody").html(
    (i, prevHTML) =>
      prevHTML +
      `
        <tr class="transition">
            <td>${state}</td>
            ${generateFieldCells(state)}
        </tr>
    `
  );
}

/**
 * @param {String} string 
 */
function replaceByFi(string) {
  return string.replace(/N/g, "Φ");
}
/**
 *
 * @param {String} id - Takes in id for states
 */

function generateFieldCells(state) {
  let fields = "";
  for (let i = 0; i < alphabetSet.length; i++) {
    fields += `<td><input style="width:100px" id=${state}-${i} oninput="handleFiInput(event)" /></td>`;
  }
  return fields;
}

/**
 * @param {Array<String>} alphabets
 * @returns {void}
 */
function appendAlphabets(alphabets) {
  alphabets.forEach(el => {
    $("#headerRow").append(`<th>δ(Q , ${el})</th>`);
  });
  let item = $("#alphabetSet").find("p")[0];
  $(item).html(
    (i, origText) =>
      origText + "{ " + alphabets.reduce((a, b) => a + ", " + b) + " }"
  );
}

// HELPERS

function isSubset(set, subset) {
  return !subset.some(val => set.indexOf(val) === -1);
}

/** END **/
