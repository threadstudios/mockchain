class State {
    constructor(initial = {}) {
        this.data = initial;
    }
    setState(data) {
        this.data = Object.assign({}, this.data, data);
    }
}

module.exports = State;