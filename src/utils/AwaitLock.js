class AwaitLock {
    acquired;
    waitingResolvers;

    constructor() {
        this.acquired = false;
        this.waitingResolvers = [];
    }

    isAcquired() {
        return this.acquired;
    }

    async acquireAsync(timeout) {
        if (!this.acquired) {
            this.acquired = true;
            return Promise.resolve();
        }

        if (timeout === undefined) {
            return new Promise((resolve) => {
                this.waitingResolvers.push(resolve);
            });
        }

        let resolver;
        let timer;

        return Promise.race([
            new Promise((resolve) => {
                resolver = () => {
                    if (timer !== null) {
                        clearTimeout(timer);
                    }
                    resolve();
                };
                this.waitingResolvers.push(resolver);
            }),
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    this.waitingResolvers.splice(this.waitingResolvers.indexOf(resolver), 1);
                    reject(new Error(`Timed out waiting for lock`));
                }, timeout);
            }),
        ]);
    }

    tryAcquire() {
        if (!this.acquired) {
            this.acquired = true;
            return true;
        }
        return false;
    }

    release() {
        if (!this.acquired) {
            throw new Error(`Cannot release an not acquired lock`);
        }
        if (this.waitingResolvers.size > 0) {
            // Sets preserve insertion order like a queue
            const [resolve] = this.waitingResolvers;
            this.waitingResolvers.splice(this.waitingResolvers.indexOf(resolve), 1);
            resolve();
        } else {
            this.acquired = false;
        }
    }
}

module.exports = {
    AwaitLock
};