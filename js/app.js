

let mode = 'move';
window.onload = () => $('#mode [data-key="' + loadMode() + '"]').click();
const [cnv, ctx] = createCanvas(innerWidth, innerHeight);
document.body.appendChild(cnv);

let contextMenuPos = { x: 0, y: 0 };
let activeState = null;
const config = {
    state: {
        radius: 20,
        terminalRadius: 5,
    },
};

let fa = new FiniteAutomata();
let fa2 = new FiniteAutomata();
fa.import(load());
fa2.import(load());
render();
let dfaToBeCompared = []

$("#clear").onclick = function () {
    if (!confirm('Are you sure? everything will be removed')) return;
    localStorage.clear();
    resetCanvas();
    dfaToBeCompared = [];
}

$('#test').onclick = function () {
    try {
        // Validate that the finite automaton is a DFA
        fa.validateDFA();// this will go to catch if it isnt a true dfa

        // If validation is successful, prompt the user for an input string
        const inputString = prompt('Enter a string to test:');

        if (inputString !== null) {
            try {
                const isAccepted = fa.isAccepted(inputString);
                alert(`The input string "${inputString}" is${isAccepted ? '' : ' not'} accepted.`);
            } catch (error) {
                if (error instanceof ValidationError) {
                    alert(`Validation Error: ${error.message}`);
                } else {
                    alert(`An unexpected error occurred: ${error.message}`);
                }
            }
        }
    } catch (error) {
        if (error instanceof ValidationError) {
            alert(`Validation Error: ${error.message}`);
        } else {
            alert(`An unexpected error occurred: ${error.message}`);
        }
    }
};

$('#reset').onclick = function () {
    if (!confirm('Are you sure? everything will be removed')) return;
    resetCanvas();

};

function resetCanvas() {
    fa = new FiniteAutomata();
    try {
        localStorage.removeItem('fa');
        localStorage.removeItem('mode');
    } catch (e) {
        handleError(e);
    }
    render();
}

$$('#mode > button').forEach(
    button =>
    (button.onclick = function () {
        $$('#mode > button').forEach(button => button.classList.remove('active'));
        mode = this.getAttribute('data-key');
        this.classList.add('active');
        saveMode();
    })
);

$('#export-image').onclick = function () {
    const a = document.createElement('a');
    a.download = 'export-dfa';
    a.href = cnv.toDataURL();
    a.click();
};

$('#minimizedfa').onclick = () => {
    try {
        fa.validateDFA();
        if (!confirm('Are you sure you want to minimize this DFA?')) return; 
        let newnFA = new MinimizedDFA(fa);
        newnFA = newnFA.minimize(fa);
        //import the state
        resetCanvas();
        fa.import(newnFA.export());
        render();

    } catch (error) {
        alert(error.message);
    }
};

window.onkeydown = function (e) {
    if (mode !== 'design' && e.ctrlKey) {
        $('#mode [data-key="design"]').click();
    }
};
window.onkeyup = function (e) {
    if (mode !== 'move' && e.key === 'Control') {
        $('#mode [data-key="move"]').click();
    }
};
window.onresize = function () {
    cnv.width = window.innerWidth;
    cnv.height = window.innerHeight;

    render();
};
window.onkeypress = function (e) {
    switch (e.key) {
        case 'm':
            $('#mode [data-key="move"]').click();
            break;

        case 'd':
            $('#mode [data-key="design"]').click();
            break;
    }
};
cnv.onmousedown = function ({ button, x, y }) {
    contextMenu();

    if (mode === 'move' && button !== 2) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            activeState = states[0].name;
        }
    }

    if (mode === 'design' && button !== 2) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            activeState = states[0].name;
        }
    }
};
cnv.onmouseup = function ({ x, y }) {
    if (mode === 'move' && activeState !== null) {
        const state = fa.states[activeState];
        state.moving = false;

        activeState = null;

        save();
        render();
    }

    if (mode === 'design' && activeState !== null) {
        const states = fa.findNearestStates(x, y);
        if (states.length) {
            const start = fa.states[activeState];
            const target = states[0];
            const symbol = prompt('enter symbol . for lambda symbol enter nothing and press ok');

            if (symbol !== null && symbol !== "" && symbol.length === 1) start.translate(symbol, target.name);
        }
        render();
        save();
        activeState = null;
    }
};
cnv.onmousemove = function ({ x, y }) {
    if (mode === 'move' && activeState !== null) {
        const movingState = fa.states[activeState];

        movingState.x = x;
        movingState.y = y;

        render();
    }

    if (mode === 'design' && activeState !== null) {
        const beginState = fa.states[activeState];
        ctx.clearRect(0, 0, cnv.width, cnv.height);

        ctx.save();
        ctx.beginPath();

        ctx.moveTo(beginState.x, beginState.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.closePath();
        ctx.restore();

        render(false);
    }
};
function onTransitionRemoveClick(data) {
    contextMenu();
    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);
    if (!states.length) return false;

    const state = states[0];
    const [symbol, target] = data.split('-');

    if (symbol in state.transitions && state.transitions[symbol].includes(target)) {
        state.transitions[symbol] = state.transitions[symbol].filter(s => s !== target);
        if (state.transitions[symbol].length === 0) {
            delete state.transitions[symbol];
        }
    }

    save();
    render();
}
function onTransitionRenameClick(data) {
    contextMenu();
    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

    // no state selected, so terminate the rest of execution
    if (!states.length) return false;

    const state = states[0];
    const [symbol, target] = data.split('-');
    const newSymbol = prompt('enter symbol. for lambda symbol enter nothing and press ok', symbol);
    // if operation canceled or newSymbol is equals to old symbol, terminate the rest of execution
    if (newSymbol === null || newSymbol === symbol) return false;

    if (state.transitions[symbol].length > 1) {
        state.transitions[symbol] = state.transitions[symbol].filter(s => s !== target);
        if (!state.transitions[newSymbol] || state.transitions[newSymbol].length === 0) {
            state.transitions[newSymbol] = [];
        }
        state.transitions[newSymbol].push(target);
    } else {
        delete state.transitions[symbol];
        if (state.transitions[newSymbol]) {
            state.transitions[newSymbol].push(target);
            state.transitions[newSymbol] = [...new Set(state.transitions[newSymbol])];
        } else {
            state.transitions[newSymbol] = [target];
        }
    }

    save();
    render();
}
cnv.oncontextmenu = function (e) {
    e.preventDefault();
    const { x, y } = e;
    contextMenuPos = { x, y };
    const states = fa.findNearestStates(x, y);
    const listItem = findNearestListItem(x, y);

    if (states.length) {
        const state = states[0];
        const items = [
            {
                text: 'terminal ' + (state.terminal ? 'off' : 'on'),
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        state.terminal = !state.terminal;

                        save();
                        render();
                    }

                    contextMenu();
                },
            },
            {
                text: 'rename state',
                onclick: () => {
                    contextMenu();
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);
                    if (!states.length) return false;

                    const state = states[0];
                    const oldName = state.name;
                    const newName = prompt('enter new name', oldName);
                    if (newName === null || !newName.trim() || newName === oldName) return;

                    if (fa.states[newName] !== undefined) {
                        return alert(newName + ' already exists');
                    }

                    fa.states[newName] = fa.states[oldName];
                    fa.states[newName].name = newName;
                    delete fa.states[oldName];

                    // rename transitions target of the other states
                    for (let key in fa.states) {
                        if (!fa.states.hasOwnProperty(key)) continue;

                        const state = fa.states[key];

                        if (state.name === oldName) {
                            state.name = newName;
                        }
                        for (let symbol in state.transitions) {
                            if (!state.transitions.hasOwnProperty(symbol)) continue;

                            for (let s in state.transitions[symbol]) {
                                if (!state.transitions[symbol].hasOwnProperty(s)) continue;

                                if (state.transitions[symbol][s] === oldName) {
                                    state.transitions[symbol][s] = newName;
                                }
                            }
                        }
                    }

                    // if oldName was start, make newName as start point
                    if (fa.start === oldName) {
                        fa.start = newName;
                    }

                    save();
                    render();
                },
            },
            {
                text: 'remove state',
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        try {
                            fa.removeState(state.name);
                            save();
                            render();
                        } catch (e) {
                            console.log(e);
                        }
                    }

                    contextMenu();
                },
            },
        ];

        const removeTransitionsMenu = [];
        for (let symbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(symbol)) continue;

            for (let target of state.transitions[symbol]) {
                removeTransitionsMenu.push({
                    text: `σ({${state.name}}, ${symbol === '' ? 'λ' : symbol}) = {${target}}`,
                    data: `${symbol}-${target}`,
                    onclick: onTransitionRemoveClick,
                });
            }
        }
        if (removeTransitionsMenu.length) {
            items.push({
                text: 'remove transitions',
                children: removeTransitionsMenu,
            });
        }

        const renameTransitionsMenu = [];
        for (let symbol in state.transitions) {
            if (!state.transitions.hasOwnProperty(symbol)) continue;

            for (let target of state.transitions[symbol]) {
                renameTransitionsMenu.push({
                    text: `σ({${state.name}}, ${symbol === '' ? 'λ' : symbol}) = {${target}}`,
                    data: `${symbol}-${target}`,
                    onclick: onTransitionRenameClick,
                });
            }
        }
        if (renameTransitionsMenu.length) {
            items.push({
                text: 'rename transitions',
                children: renameTransitionsMenu,
            });
        }

        if (fa.start !== state.name) {
            items.push({
                text: 'make start point',
                onclick: () => {
                    const states = fa.findNearestStates(contextMenuPos.x, contextMenuPos.y);

                    if (states.length) {
                        const state = states[0];
                        fa.start = state.name;

                        save();
                        render();
                    }

                    contextMenu();
                },
            });
        }

        contextMenu({ x, y, items });
    }
    else {
        contextMenu({
            x,
            y,
            items: [
                {
                    text: 'create new state',
                    onclick: () => {
                        const { x, y } = contextMenuPos;
                        const name = prompt('State Name: ');

                        if (name === null || !name.trim() || name.length > 1) {
                            contextMenu();
                            return;
                        }

                        try {
                            fa.addState({
                                name,
                                x,
                                y,
                            });
                        } catch (e) {
                            console.log(e);
                        }

                        save();
                        contextMenu();
                        render();
                    },
                },
            ],
        });
    }
};



$("#import").onclick = function () {
    if (!document.getElementById("myDropdown").classList.contains("show")) {
        document.getElementById("myDropdown").classList.toggle("show");
        refreshImportDropdown();
        return;
    }
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
        }
    }
}



$("#save").onclick = function () {
    saveDFA();
}


$("#compare").onclick = function () {
    
    if (!document.getElementById("myDropdown2").classList.contains("show")) {
        document.getElementById("myDropdown2").classList.toggle("show");
        refreshImportDropdownCompare();
        return;
    }
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
        }
    }
}


//function to save automata
function saveDFA() {
    const fsmData = JSON.stringify(fa.export());
    const fsmName = prompt('Enter a name for the saved state:');

    if (fsmName !== null) {
        const savedStates = JSON.parse(localStorage.getItem('savedStates')) || [];

        //check if name already exists if so overwrite
        const existingState = savedStates.find(state => state.name === fsmName);

        if (existingState) {
            const confirmOverwrite = confirm(`A saved state with the name "${fsmName}" already exists. Do you want to overwrite it?`);

            if (confirmOverwrite) {
                existingState.fsm = fsmData;
            }
        } else {
            savedStates.push({ name: fsmName, fsm: fsmData });
        }
        localStorage.setItem('savedStates', JSON.stringify(savedStates));
        refreshImportDropdown();
    }
}

//function to refresh the Import States dropdown content menu list, 
let savedStates = [];
let index = 0;
function refreshImportDropdown() {
    savedStates = JSON.parse(localStorage.getItem('savedStates')) || [];
    const dropdownContent = document.getElementById("myDropdown");

    // Clear existing dropdown content
    dropdownContent.innerHTML = "";

    index = 0;
    // Add links for each saved state with right-click context menu
    savedStates.forEach(savedState => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');

        link.href = "#";
        link.innerText = savedState.name;

        link.onclick = function () {
            //ask for confirmation before importing the state
            const confirmImport = confirm(`Are you sure you want to import state "${savedState.name}"?`);

            if (confirmImport) {
                //import the state
                const importedState = JSON.parse(savedState.fsm);
                fa.import(importedState);
                render();
            }
        }

        // Add the link to the dropdown
        listItem.appendChild(link);
        dropdownContent.appendChild(listItem);
        index++;
    });
}

function refreshImportDropdownCompare() {
    savedStates = JSON.parse(localStorage.getItem('savedStates')) || [];
    const dropdownContent = document.getElementById("myDropdown2");

    // Clear existing dropdown content
    dropdownContent.innerHTML = "";

    index = 0;
    // Add links for each saved state with right-click context menu
    savedStates.forEach(savedState => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');

        link.href = "#";
        link.innerText = savedState.name;
        
        link.onclick = function () {
            // Select Dfa to be compared and store it in dfaToBeCompared array
            if (dfaToBeCompared.length < 2 && !listItem.classList.contains("Selected")) {
                let tempDfa = new FiniteAutomata();
                const importatedState = JSON.parse(savedState.fsm)
                tempDfa.import(importatedState)
                dfaToBeCompared.push(tempDfa)
                listItem.classList.add("Selected")
            }
        }
        // Add the link to the dropdown
        listItem.appendChild(link);
        dropdownContent.appendChild(listItem);
        index++;
    });
    // Add compare button in the dropdown
    const compareBtn = document.createElement('button')
    compareBtn.innerText = "Compare"
    compareBtn.classList.add("compare-btn")
    compareBtn.onclick = function () {
        selectedContent = document.getElementsByClassName("Selected")
        if (selectedContent.length != 2) {
            alert("Select 2 Dfas to compare")
        }
        else {
            let dfa1 = selectedContent[0].innerText
            let dfa2 = selectedContent[1].innerText
            if (compareDfas(dfaToBeCompared[0],dfaToBeCompared[1])) {
                alert("The 2 Dfas " + dfa1 + " and " + dfa2 +" are Equivilent")
            }
            else {
                alert("The 2 Dfas " + dfa1 + " and " + dfa2 +" aren't Equivilent")
            }
        }
    }
    dropdownContent.appendChild(compareBtn)
    const resetBtn = document.createElement('button')

    // Add reset button in the dropdown
    resetBtn.innerText = "Reset"
    resetBtn.classList.add("reset-btn")
    resetBtn.onclick = function () {
        dfaToBeCompared = []
        selectedContent = document.getElementsByClassName("Selected")
        while (selectedContent.length != 0) {
            selectedContent[0].classList.remove('Selected')
        }
    }
    dropdownContent.appendChild(resetBtn)
}

function findNearestListItem(x, y) {
    const listItemElements = document.querySelectorAll('#myDropdown li');

    // Convert NodeList to an array for easier manipulation
    const listItems = Array.from(listItemElements);

    // Filter list items based on distance
    const nearestListItem = listItems.reduce((nearest, listItem) => {
        const boundingBox = listItem.getBoundingClientRect();
        const listItemX = boundingBox.left + boundingBox.width / 2;
        const listItemY = boundingBox.top + boundingBox.height / 2;

        const distance = Math.sqrt(Math.pow(x - listItemX, 2) + Math.pow(y - listItemY, 2));

        // Check if the distance is within 5 pixels
        if (distance <= 1 && (!nearest || distance < nearest.distance)) {
            return { element: listItem, distance };
        } else {
            return nearest;
        }
    }, null);

    return nearestListItem ? nearestListItem.element : null;
}

