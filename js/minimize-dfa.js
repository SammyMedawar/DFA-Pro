class MinimizedDFA {

    constructor(dfa) {}

    minimize(dfa) {        
        //crete a temporary new minimized dfa
        let minimizedDFA = new FiniteAutomata();
        minimizedDFA.setStartState(dfa.getStartState());
        minimizedDFA.setStates(dfa.getStates());
        minimizedDFA.setSymbols(dfa.getSymbols());
        // find the reachable states
        minimizedDFA.setStates(this.findReachableStates(minimizedDFA));
        let partition = (this.partitioning(minimizedDFA.getStates(), minimizedDFA));
        let finalResult = this.createNewDFA(partition, minimizedDFA);
        return finalResult;
    }


    //use dfs to find the reachable states
    findReachableStates(minimizedDFA) {
        // create a set of visited states, it is a set to make sure it is unique
        const visited = new Set();

        //get the initial state
        // basically, there is a function to get the states based on its name
        const initialState = minimizedDFA.states[minimizedDFA.start];

        if (initialState) {
            this.dfsRecursive(initialState, visited, minimizedDFA);
        }

        const reachableStates = Array.from(visited);
        return reachableStates;
    }

    // dfs is recursive, opted not to use a stack
    dfsRecursive(currentState, visited, minimizedDFA) {
        // if the current state has already been visited or the number of visited states is equal
        //to the number of states, then return
        if (visited.has(currentState) || visited.size === minimizedDFA.getStates().length) {
            return;
        }
        //mark the current state as visited by adding it to the visited set
        visited.add(currentState);
        //iterate through each transition of the current state
        // for every input symbol in alphabet
        for (let symbol in currentState.transitions) {
            for (let targetState of currentState.transitions[symbol]) {
                // if visited doesnt have target state and target state is a valid state
                if (!visited.has(targetState) && minimizedDFA.states[targetState]) {
                    this.dfsRecursive(minimizedDFA.states[targetState], visited, minimizedDFA);
                }
            }
        }
    }




    partitioning(reachableStates, minimizedDFA) {
        //get the final states
        let acceptingStates = this.findAcceptingStates(minimizedDFA);

        //create the initial partition P
        let partition = [new Set(acceptingStates), new Set(reachableStates.filter(state => !acceptingStates.includes(state)))];

        //create work ds and initialize it equal to P
        let work = [];
        work.push(new Set(acceptingStates));
        work.push(new Set(reachableStates.filter(state => !acceptingStates.includes(state))));

        while (work.length !== 0) {
            const setOfStates = work.pop();
            let newPartition = [...partition];//initialize new partition as equal to partition
            for (const symbol of minimizedDFA.getSymbols()) {
                // put inside a set, all the states inside the dfa where given an input (any input),
                // it will lead to a transition state INSIDE set of states
                let statesWhoHaveTransitionsLeadingToSet = this.getStatesWhoHaveTransitionsLeadingSet(setOfStates, symbol, minimizedDFA);
                for (let set of partition) {
                    // get the commons between set and statesWhoHaveTransitionsLeadingToSet
                    let intersection = new Set([...statesWhoHaveTransitionsLeadingToSet].filter(state => set.has(state)));
                    // get complement of set and statesWhoHaveTransitionsLeadingToSet
                    let difference = new Set([...set].filter(state => !(statesWhoHaveTransitionsLeadingToSet.has(state))));
                    if (intersection.size > 0 && difference.size > 0) {
                        //replace current set with 2 new sets: intersection and difference
                        newPartition.splice(partition.indexOf(set), 1, intersection, difference)
                        //if set is in w (reminder that set could also be not the one we just popped)
                        if (this.doesWorkIncludeSet(work, set)) {
                            work.splice(work.indexOf(set), 1, intersection, difference);
                        } else {
                            if (intersection.size <= difference.size) {
                                work.push(intersection);
                            } else {
                                work.push(difference);
                            }
                        }

                    }
                }
                partition = newPartition;
            }
        }
        return partition;
    }

    getStatesWhoHaveTransitionsLeadingSet(setOfStates, symbol, minimizedDFA) {
        let results = new Set();
        for (const state of minimizedDFA.getStates()) {
            // if the result of state given symbol is a state inside setOfStates, add to result
            // the original state not transition
            let transitionState = state.getTransition(symbol);
            innerLoop: for (const innerState of setOfStates) {
                if (innerState.name === transitionState[0]) {
                    results.add(state);
                    break innerLoop;
                }
            }
            if (results.size == minimizedDFA.getStates().size) {
                break;
            }
        }
        return results;
    }

    findAcceptingStates(minimizedDFA) {
        let acceptingStates = [];
        let allStates = minimizedDFA.getStates();

        for (let i = 0; i < allStates.length; i++) {
            const state = allStates[i];

            if (state.terminal) {
                acceptingStates.push(state);
            }
        }
        return acceptingStates;
    }

    doesWorkIncludeSet(work, set) {
        for (const workSet of work) {
            const workArray = [...workSet];
            const setArray = [...set];

            if (workArray.length === setArray.length && workArray.every(elem => setArray.includes(elem))) {
                return true;  // Work includes the set
            }
        }

        return false;  // Work does not include the set
    }



    createNewDFA(partition, oldDFA) {
        const newDFA = new FiniteAutomata();

        newDFA.symbols = oldDFA.symbols;

        // for each partition, take the first state
        // if the transition given alphabet x belongs to the current state, self-loop
        // else find the partition for which the transition state belongs to
        // and create the transition from first state in current partition
        // to first state in next transition
        // as for start state, check if any of the states inside partition are start states
        // same for terminals
        partition.forEach(innerSet => {
            // get first state of the current set
            const firstState = Array.from(innerSet)[0];
            //check if any state is terminal
            const isTerminal = Array.from(innerSet).some(stateName => stateName.terminal);

            //check if any state is a start state
            const isStart = this. isStartState(innerSet, oldDFA);

            // Combine transitions
            const combinedTransitions = {};
            for (let i = 0; i < oldDFA.getSymbols().length; i++) {
                let symbol = oldDFA.getSymbols()[i];
                // get transition state
                let targetState = firstState.getTransition(symbol);
                // if transition targets a state inside the current state, make a self loop
                if (this.doesSetHaveState(innerSet, targetState)) {
                    firstState.setTransition(symbol, firstState.name);
                }
                //else get the partition of the target state and then get the first state of gotten partition
                else {
                    let newTargetState = this.getFirstStateOfPartitionGivenTargetState(targetState, partition);
                    firstState.setTransition(symbol, newTargetState.name);
                }
            }

            newDFA.addState(firstState);

            // Set start state if applicable
            if (isStart) {
                newDFA.start = firstState.name;
            }
        });

        return newDFA;
    }

    getFirstStateOfPartitionGivenTargetState(targetState, partition) {
        const mySetsArray = Array.from(partition);
        for(let j = 0; j < mySetsArray.length; j++){
            if(this.doesSetHaveState(mySetsArray[j], targetState)){
                let mySet = mySetsArray[j];
                const myArray = Array.from(mySet);
                return myArray[0];
            }
        }
        return null;
    
    }

    doesSetHaveState(set, targetState){
        const myArray = Array.from(set);
        for(let i = 0; i < myArray.length; i++){
            let comparedState = myArray[i];
            // why the fuck does targetState only return a name!!!!!!
            if(comparedState.name === targetState[0]){
                return true;
            }
        }
        return false;
    }

    isStartState(set, DFA){
        let mySet = Array.from(set);
        for(let i = 0; i < mySet.length; i++){
            if(mySet[0].name === DFA.start){
                return true;
            }
        }
        return false;
    }

}
