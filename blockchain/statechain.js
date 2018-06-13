const BlockChain = require('./index');
const State = require('../state/State');

class StateChain {
    constructor(id, initialState) {
        this.id = id;
        this.chain = new BlockChain(id);
        this.state = new State(initialState);
    }
    add(data, prevHash) {
        return new Promise((resolve, reject) => {
            if (!this.chain.getLatest() || prevHash === this.chain.getLatest().hash) {
                this.state.setState(data);
                this.chain.add(data).then((block) => {
                    resolve(block);
                });
            } else {
                /*
                 if hash exists on this chain lets figure out what we have missed
                 else treat it as a duff request.
                 */
                return reject({ ...this.chain.getHash(prevHash), ...this.getFresh() })
            }
        })
    }
    getFresh() {
        return {
            ...this.state.data,
            hash : this.currentHash
        }
    }
}

module.exports = StateChain;