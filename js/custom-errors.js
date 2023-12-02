class CustomError {
    constructor(message) {
        this.message = message;
    }
}
class NoTerminalStateError extends CustomError {
    constructor(message = 'there is no terminal state') {
        super(message);
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class StateNotFoundError extends CustomError {
    constructor(message = 'state not found in fa') {
        super(message);
    }
}