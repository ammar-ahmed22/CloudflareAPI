String.prototype.filter = function (
    this: string,
    cb: (char: string, idx: number) => boolean
) {
    let newS = "";
    for (let i = 0; i < this.length; i++) {
        if (cb(this[i], i)) {
            newS += this[i];
        }
    }

    return newS;
};
