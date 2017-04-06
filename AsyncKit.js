module.exports = class AsyncKit {
    constructor(creators = {}) {
        Object.defineProperty(this, '__kit', {
            value: {
                creators: {},
                values: {},
                promises: {},
                decorator: (value, name) => value
            }
        });

        if (creators instanceof AsyncKit) {
            creators = creators.__kit.creators;
        }

        for (let creator in creators) {
            this.add(creator, creators[creator]);
        }

        this.set = this.set.bind(this);
        this.add = this.add.bind(this);
        this.get = this.get.bind(this);
        this.create = this.create.bind(this);
        this.remove = this.remove.bind(this);
        this.defineDecorator = this.defineDecorator.bind(this);
    }

    set(name, creator) {
        return this.add(name, creator);
    }

    add(name, creator) {
        if (creator instanceof Function) {
            this.remove(name);

            if (this.__kit.creators[name] === undefined) {
                Object.defineProperty(this, name, {
                    get: () => this.get(name),
                    enumerable: true
                });
            }

            this.__kit.creators[name] = creator;
        } else if (name instanceof Object && creator === undefined) {
            for (let key in name) {
                this.add(key, name[key])
            }
        } else {
            throw new Error(`'${name}' : creator is not a function`)
        }

        return this;
    }

    get(name) {
        if (Array.isArray(name)) {
            return Promise.all(name.map((name) => this.get(name)));
        }

        if (this.__kit.promises[name]) {
            return this.__kit.promises[name];
        }

        let resolver = (value) => value;
        let rejecter = (err) => Promise.reject(err);

        let promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });

        this.__kit.promises[name] = promise;

        Promise.resolve()
            .then(() => {
                if (this.__kit.values[name] === undefined) {

                    return this.create(name)
                        .then((value) => {
                            this.__kit.values[name] = value;
                            return value;
                        });
                }

                return this.__kit.values[name];
            })
            .then((value) => {
                if (this.__kit.promises[name]) {
                    delete this.__kit.promises[name];
                }
                return value;
            })
            .catch((error) => {
                if (this.__kit.promises[name]) {
                    delete this.__kit.promises[name];
                }
                return Promise.reject(error);
            })
            .then(resolver)
            .catch(rejecter);

        return promise;
    }

    create(name) {
        return (() => {
            return Promise.resolve()
                .then(() => {
                    if (this.__kit.creators[name]) {
                        return Promise.resolve()
                            .then(() => this.__kit.creators[name](this))
                            .then((value) => this.__kit.decorator(value, name));
                    }

                    return undefined;
                });
        })();
    }

    remove(name) {
        if (this.__kit.values[name] !== undefined) {
            delete this.__kit.values[name];
        }

        if (this.__kit.creators[name]) {
            this.__kit.creators[name] = null;
        }
    }

    defineDecorator(decorator) {
        if (decorator instanceof Function) {
            this.__kit.decorator = (value, name) => decorator(value, name);
        }
    }
};
