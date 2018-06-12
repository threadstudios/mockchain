const CryptoJS = require("crypto-js");
const Block = require('./Block');

const getGenesisBlock = () => {
    return new Block(0, "0", Date.now() / 1000, "BG Genesis block", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
};

var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

var calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

class BlockChain {
    constructor() {
        this.chain = [getGenesisBlock()]
    }
    getLatest() {
        return this.chain[this.chain.length - 1];
    }
    _createBlock(data) {
        const previous = this.getLatest();
        const nextIndex = previous.index + 1;
        const ts = new Date().getTime() / 1000;
        const nextHash = calculateHash(nextIndex, previous.hash, ts, data);
        return new Block(nextIndex, previous.hash, ts, data, nextHash);
    }
    _canAdd(next, prev) {
        return new Promise((resolve, reject) => {
            if (prev.index + 1 !== next.index) {
                reject('Invalid index');
            } else if (prev.hash !== next.previousHash) {
                reject('Invalid previous hash')
            } else if (calculateHashForBlock(next) !== next.hash) {
                reject('Hash is invalid')
            } else {
                resolve(next)
            }
        })
    }
    add(data) {
        return new Promise((resolve, reject) => {
            const block = this._createBlock(data);
            this._canAdd(block, this.getLatest())
            .then(block => this.chain.push(block))
            .then(block => resolve(block))
            .catch(err => reject(err))
        });
    }
}

module.exports = new BlockChain();
