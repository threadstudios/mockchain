const BlockChain = require('./index');
const State = require('../state/State');

class StateChain {
    constructor(id, initialState) {
        this.id = id;
        this.chain = new BlockChain(id);
        this.state = new State(initialState);
    }
    add(data, prevHash) {
        if (this.currentHash === false || prevHash === this.currentHash) {
            this.state.setState(data);
            return this.chain.add(data);
        } else {
            /*
             if hash exists on this chain lets figure out what we have missed
             else treat it as a duff request.
             */
            return Promise.reject({ ...this.chain.getHash(prevHash), ...this.getFresh() })
        }
    }
    getFresh() {
        return {
            ...this.state.data,
            hash : this.currentHash
        }
    }
}

module.exports = StateChain;