// Check if 2 state pairs are equal
function areEqual(statePair1, statePair2) {
    return statePair1.fa1s == statePair2.fa1s && statePair1.fa2s == statePair2.fa2s
}

// 'Check if a state pair is present in an array
function isContained(parameter, statePair) {
    let answer = false
    parameter.forEach((pStatePair) => {
        if(areEqual(pStatePair, statePair)) {
            answer = true;
        }
    })
    return answer;
}

// Checks if 2 dfas are equivalent
function compareDfas(fa1, fa2) {
    let completed = []; // Array for storing checked pairs
    let parameter = []; // Array for queuing unchecked pairs
    
    // Adds starting states pair to parameter array
    parameter.push(
        {
            fa1s: fa1.getState(fa1.getStartState()),
            fa2s: fa2.getState(fa2.getStartState())
        }
    );

    while (parameter.length != 0) {
            // If 2 states with in a pair have different terminality, the function will return false
            if (parameter[0].fa1s.isTerminal() != parameter[0].fa2s.isTerminal()) {
                return false;
            }

            fa1.getSymbols().forEach((symbol) => {
                // Adding the transitions of each pair to the parameter queue
                let tempPair = {
                    fa1s: fa1.getState(parameter[0].fa1s.getTransition(symbol)[0]),
                    fa2s: fa2.getState(parameter[0].fa2s.getTransition(symbol)[0])
                }
                // The transition pair will only be added if it is not already present in the paramater queue and in the completed array
                if (!isContained(parameter, tempPair) && !isContained(completed, tempPair)){
                    parameter.push(tempPair);
                }
            })
            // Add current state pair to the completed array
            if (!isContained(completed, parameter[0])) {
                completed.push(parameter[0])
            }
            // Remove current state pair from parameter queue
            parameter.shift()
    }
    return true;
}