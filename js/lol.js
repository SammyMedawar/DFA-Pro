class MinimizedDFA {

    // in this constructor, i am taking the dfa as input, and instead of directly editiing the dfa
    // i am creating a temporary other dfa which will be minimized instead

    constructor(dfa) {
        this.minimizedDFA = new FiniteAutomata();
        this.minimizedDFA.setStartState(dfa.getStartState());
        this.minimizedDFA.setStates(dfa.getStates());
        this.minimizedDFA.setSymbols(dfa.getSymbols());
        this.minimize();
    }

    minimize() {
        // find the reachable states
        this.minimizedDFA.setStates(this.findReachableStates(this.minimizedDFA));
        let x = (this.applyHopcroftsAlgorithm(this.minimizedDFA.getStates()));
        console.log(x);
    }


    //use dfs to find the reachable states
    findReachableStates() {
        // create a set of visited states, it is a set to make sure it is unique
        const visited = new Set();

        //get the initial state
        // basically, there is a function to get the states based on its name
        const initialState = this.minimizedDFA.states[this.minimizedDFA.start];

        if (initialState) {
            this.dfsRecursive(initialState, visited);
        }

        const reachableStates = Array.from(visited);
        return reachableStates;
    }

    // dfs is recursive, opted not to use a stack
    dfsRecursive(currentState, visited) {
        // if the current state has already been visited or the number of visited states is equal
        //to the number of states, then return
        if (visited.has(currentState) || visited.size === this.minimizedDFA.getStates().length) {
            return;
        }
        //mark the current state as visited by adding it to the visited set
        visited.add(currentState);
        //iterate through each transition of the current state
        // for every input symbol in alphabet
        for (let symbol in currentState.transitions) {
            for (let targetState of currentState.transitions[symbol]) {
                // if visited doesnt have target state and target state is a valid state
                if (!visited.has(targetState) && this.minimizedDFA.states[targetState]) {
                    this.dfsRecursive(this.minimizedDFA.states[targetState], visited);
                }
            }
        }
    }




    partitioning(reachableStates) {
        //get the final states
        // if reachable state includes a state that is terminal then add it to accepting states
        const acceptingStates = this.findAcceptingStates();
        // create a parition of 2 sets accepting states and non accepting states
        const partition = [new Set(acceptingStates), new Set(reachableStates.filter(state => !acceptingStates.includes(state)))];

        let k = 1;

        do{
            let newPartition = [];
            // for each set of states inside parition
            setsInsideParition: for(const setOfStates of partition){
                let tempSetOfStates = new Set();

                //for each states inside the setOfStates
                statesInsideSet: for(const elementCurrent of setOfStates){
                    //find the element directly after in the same set
                    let elementAfter = this.findElementAfter(elementCurrent, setOfStates);
                    if(elementAfter === null){
                        break statesInsideSet;
                    }
                    let isDifferentPartition = false;
                    //for each input in alphabet
                    for(let symbol of this.minimizedDFA.getSymbols()){
                        //find the transition states of the current and after states
                        const transitionCurrent = elementCurrent.transitions;
                        const transitionAfter = elementAfter.transitions;
                        isDifferentPartition = this.areStatesInSamePartition(partition, transitionCurrent, transitionAfter)
                        
                    }
                }

            }

        }while(true);
    }

    

    findAcceptingStates() {
        let acceptingStates = [];
        let allStates = this.minimizedDFA.getStates();

        for (let i = 0; i < allStates.length; i++) {
            const state = allStates[i];

            if (state.terminal) {
                acceptingStates.push(state);
            }
        }
        return acceptingStates;
    }

    findElementAfter(element, setOfStates) {
        let hasFoundElement = false;
        for(const innerElement of setOfStates){
            if(hasFoundElement){
                return innerElement;
            }
            if(innerElement === element){
                hasFoundElement = true;
            }
        }
        return null;
    }

    areStatesInSamePartition(partition, states1, states2) {
        for(setOfStates of partition){
            if(setOfStates.has(states1) && setOfStates.has(states2)){
                return true;
            }
        }
        return false;
    }



}
