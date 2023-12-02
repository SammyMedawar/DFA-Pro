function areEqual(statePair1, statePair2) {
    return statePair1.fa1s == statePair2.fa1s && statePair1.fa2s == statePair2.fa2s
}
function isContained(parameter, statePair) {
    let answer = false
    parameter.forEach((pStatePair) => {
        if(areEqual(pStatePair, statePair)) {
            answer = true;
        }
    })
    return answer;
}
function compareDfas(fa1, fa2) {
    let completed = [];
    let parameter = [];
    parameter.push(
        {
            fa1s: fa1.getState(fa1.getStartState()),
            fa2s: fa2.getState(fa2.getStartState())
        }
    );
    while (parameter.length != 0) {
            if (parameter[0].fa1s.isTerminal() != parameter[0].fa2s.isTerminal()) {
                return false;
            }
            fa1.getSymbols().forEach((symbol) => {
                let tempPair = {
                    fa1s: fa1.getState(parameter[0].fa1s.getTransition(symbol)[0]),
                    fa2s: fa2.getState(parameter[0].fa2s.getTransition(symbol)[0])
                }
                if (!isContained(parameter, tempPair) && !isContained(completed, tempPair)){
                    parameter.push(tempPair);
                }
            })
            if (!isContained(completed, parameter[0])) {
                completed.push(parameter[0])
            }
            parameter.shift()
    }
    return true;
}