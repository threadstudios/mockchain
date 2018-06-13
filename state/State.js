class State {
    constructor(initial = {}) {
        this.data = {};
    }
    setState(data) {
        this.data = Object.assign({}, this.data, data);
    }
}

module.exports = State;