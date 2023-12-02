class FiniteAutomata {

    // the following are getter and setter functions


    get start() {
        return this._start;
    }

    set start(start) {
        if (!Object.keys(this.states).includes(start)) {
            throw new StateNotFoundError(start + ' state does not exits in this finite automata');
        }

        this._start = start;
    }

    get symbols() {
        const predictedSymbols = this._predictSymbols();

        if (predictedSymbols.length > this._symbols.length) return predictedSymbols;

        return this._symbols;
    }
    set symbols(symbols) {
        if (!Array.isArray(symbols)) {
            throw new SymbolsShouldBeArrayError();
        }

        this._symbols = symbols;
        return this;
    }

    get states() {
        return this._states;
    }
    set states(states) {
        if (typeof states !== 'object') {
            throw new StatesShouldBeObjectError();
        }

        // make this.states iterable using "for of" loop
        this._states = iterableObject(states);
    }


    constructor({ start, states, symbols } = {}) {
        // this variable holds name of state or null
        this._start = null;
        if (start !== undefined) this.start = start;

        // this is an object which keys are state names
        // and values of the keys are an object of State class
        this.states = states || {};

        // an array of symbols. example : ['a', 'b']
        this.symbols = symbols || [];
    }

    // the following are functions that were fun :P

    // returns array of state names
    getStateNames() {
        return Object.keys(this.states);
    }

    getStates(){
        return this._states;
    }

    getState(name){
        let result = null;
        for(const state of this.getStates()){
            if(state.name === name){
                result = state;
                break;
            }
        }
        return result;
    }

    getSymbols(){
        return this._symbols;
    }
    getStartState(){
        return this._start;
    }

    setStates(states){
        this.states = states;
    }
    setSymbols(symbols){
        this._symbols = symbols;
    }
    setStartState(startState){
        this._start = startState;
    }


    //predict the input symbols needed based on all states in the diagram
    _predictSymbols() {
        const symbols = [];

        for (const { transitions } of this.states) {
            for (let symbol in transitions) {
                if (!transitions.hasOwnProperty(symbol)) continue;
                if (symbol === '') continue;

                if (symbols.includes(symbol)) continue;

                symbols.push(symbol);
            }
        }

        return symbols;
    }



    // function to find nearest states, takes x and y such that it is less than their radius
    findNearestStates(x, y) {
        return Object.values(this.states).filter(state => {
            const distance = Math.sqrt(Math.pow(x - state.x, 2) + Math.pow(y - state.y, 2));

            return distance <= state.getRadius();
        });
    }

    //function to remove a specific state by name
    removeState(name) {
        if (this.states[name] === undefined) {
            throw new StateNotFoundError(name + ' state not found');
        }

        //if state was start point, make this._start null
        if (name === this.start) {
            this._start = null;
        }

        //remove symbols from other states to this state
        for (const { transitions } of this.states) {
            for (let symbol in transitions) {
                if (!transitions.hasOwnProperty(symbol)) continue;

                transitions[symbol] = transitions[symbol].filter(target => target !== name);
            }
        }

        delete this.states[name];
        return this;
    }

    // add state to the dfa
    addState(data) {
        if (this.states[data.name] !== undefined) {
            throw new StateAlreadyExistsError(data.name + ' state already exits');
        }

        this.states[data.name] = new State(data);

        return this;
    }

    //check if the dfa has a terminal state
    hasAnyTerminalState() {
        for (let state of this.states) {
            if (state.terminal) {
                //one terminal state found
                return true;
            }
        }

        //none terminal state found
        return false;
    }



    //validate if the machine is actually a dfa
    validateDFA() {
        //check for lambda transitions
        for (const state of Object.values(this.states)) {
            if (state.transitions[''] !== undefined) {
                throw new ValidationError(`State ${state.name} has a lambda transition. DFAs should not have lambda transitions.`);
            }
        }

        //check if there is a starting state
        if (!this.start) {
            throw new ValidationError('The finite automaton does not have a starting state.');
        }

        //check if there is at least 1 final state
        if (!Object.values(this.states).some(state => state.terminal)) {
            throw new ValidationError('The finite automaton does not have any final (terminal) state.');
        }

        //check for states with no transitions
        const statesWithoutTransitions = Object.values(this.states)
            .filter(state => Object.keys(state.transitions).length === 0);

        if (statesWithoutTransitions.length > 0) {
            const stateNames = statesWithoutTransitions.map(state => state.name).join(', ');
            throw new ValidationError(`States ${stateNames} have no transitions.`);
        }

        //get the expected number of transitions
        const expectedTransitions = this.symbols.length;

        //check transitions for each state
        for (const state of Object.values(this.states)) {
            const transitionCount = Object.values(state.transitions)
                .reduce((total, transitions) => total + transitions.length, 0);

            if (transitionCount !== expectedTransitions) {
                throw new ValidationError(`State ${state.name} does not have the expected number of transitions.`);
            }
        }
    }


    //check if a given input will be accepted by the dfa
    isAccepted(input) {
        //alidate the DFA before processing the input
        this.validateDFA();

        //start at the initial state
        let currentState = this.states[this.start];

        //iterate through each symbol in the input
        for (const symbol of input) {
            //check if the symbol is a valid input symbol
            if (!this.symbols.includes(symbol)) {
                throw new ValidationError(`Invalid symbol ${symbol} in the input string.`);
            }

            //check if there is a transition for the current symbol
            if (!currentState.transitions[symbol] || currentState.transitions[symbol].length !== 1) {
                //no valid transition for the symbol or non-deterministic transition
                return false;
            }

            //move to the next state based on the transition
            currentState = this.states[currentState.transitions[symbol][0]];
        }

        //check if the final state is a terminal state
        return currentState.terminal;
    }



    // the following functions are used for rendering 
    //used for importing json string that was stored in browser
    import(json) {
        try {
            json = JSON.parse(json);
        } catch (e) {
            throw new InvalidJsonError('imported string is not a valid json');
        }

        // clear previous data before importing
        this.states = {};
        this._start = null;
        this.symbols = [];

        if (json.hasOwnProperty('states') && typeof json.states === 'object') {
            for (let key in json.states) {
                if (!json.states.hasOwnProperty(key)) continue;

                this.states[key] = new State(json.states[key]);
            }
        }
        if (json.hasOwnProperty('states') && json.hasOwnProperty('start') && Object.keys(json.states).includes(json.start)) {
            this._start = json.start;
        }
        if (json.hasOwnProperty('symbols') && Array.isArray(json.symbols)) {
            this.symbols = json.symbols;
        }

        return this;
    }

    //export fsm as json to save in browser
    export() {
        return JSON.stringify({
            start: this.start,
            states: this.states,
            symbols: this.symbols,
        });
    }



    // function to render the starting arrow of a state
    _renderStartStateArrow(ctx) {
        if (this.states[this.start] === undefined) return;

        const state = this.states[this.start];
        const y = state.y;
        const x = state.x - state.getRadius();

        ctx.beginPath();

        ctx.moveTo(x, y);
        ctx.lineTo(x - 30, y);

        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y - 10);

        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 10);

        ctx.stroke();
        ctx.closePath();
    }

    //function to render the state itself
    render(ctx) {
        this._renderStartStateArrow(ctx);

        for (let state of this.states) state.renderSelfSymbols(ctx);

        for (let state of this.states) state.renderSymbols(ctx);

        for (let state of this.states) state.renderState(ctx);

        return this;
    }

}





