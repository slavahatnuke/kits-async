# kits-async
Promise based async flow like [https://www.npmjs.com/package/kits](https://www.npmjs.com/package/kits)

## Spec
```javascript
const assert = require('assert');
const Kit = require('kits-async');

describe('Async Kit', () => {
    it('construct and get', () => {
        let kit = Kit({
            Component: () => 'component'
        });

        return Promise.resolve()
            .then(() => {
                return kit.Component
                    .then((value) => {
                        assert.equal(value, 'component');
                    })
            })
            .then(() => kit.NoComponent)
            .then((value) => assert.equal(value, undefined));
    });


    it('get - array of arguments', () => {

        let kit = Kit({
            Component1: () => Promise.resolve().then(() => 'component1'),
            Component2: () => 'component2'
        });

        return kit.get(['Component1', 'Component2'])
            .then((values) => {
                assert.deepEqual(values, ['component1', 'component2']);
            });
    });


    it('add - adds creator', () => {

        let kit = Kit();
        kit.add('Component', () => 'component');

        return kit.get('Component')
            .then((value) => {
                assert.equal(value, 'component');
            });
    });

    it('create - should return new instance', () => {

        let kit = Kit();

        class TestComponent {
        }

        kit.add('Component', () => {
            return Promise.resolve().then(() => new TestComponent())
        });

        return Promise.resolve()
            .then(() => {
                return Promise.all([kit.Component, kit.Component])
                    .then(([c1, c2]) => {
                        assert(c1 instanceof TestComponent);
                        assert(c2 instanceof TestComponent);
                        assert.equal(c1, c2);
                    });
            })
            .then(() => {
                return Promise.all([kit.Component, kit.create('Component')])
                    .then(([c1, c2]) => {
                        assert(c1 instanceof TestComponent);
                        assert(c2 instanceof TestComponent);
                        assert.notEqual(c1, c2);
                    });
            });
    });

    it('creator - should be function', () => {

        return Promise.resolve()
            .then(() => {
                let kit = Kit();
                return kit.add('Component', 'component');
            })
            .catch((err) => {
                assert.equal(err.message, "'Component' : creator is not a function");
            });
    });


    it('remove - should remove previous version', () => {

        let kit = Kit();

        class TestComponent {
        }

        kit.add('Component', () => new TestComponent());

        return kit.Component
            .then((value) => {
                assert(value instanceof TestComponent);
                kit.remove('Component');
            })
            .then(() => kit.Component)
            .then((value) => {
                assert.equal(value, undefined);
            });
    });

    it('get - should provide options in creator', () => {
        let kit = Kit();

        class TestComponent {
            constructor(options) {
                this.options = options;
            }
        }

        kit.add('Component', ({get}) => {
            return get('Options')
                .then((options) => new TestComponent(options));
        });

        kit.add('Options', () => {
            return Promise.resolve()
                .then(() => {
                    return {
                        name: 'test',
                        version: 1
                    }
                });
        });

        return kit.Component
            .then((component) => {
                assert.deepEqual(component.options, {
                    name: 'test',
                    version: 1
                });
            });
    });

    it('add - should remove previous value', () => {

        let kit = Kit();

        class TestComponent {
        }

        kit.add('Component', () => new TestComponent());

        return Promise.resolve()
            .then(() => {
                return kit.Component
                    .then((value) => {
                        assert(value instanceof TestComponent);
                    })
            })
            .then(() => {
                kit.add('Component', () => 'value');
                return kit.get('Component')
                    .then((value) => {
                        assert.equal(value, 'value');
                    })
            })
    });

    it('set - is alias for add', () => {

        let kit = Kit();

        class TestComponent {
        }

        kit.set('Component', () => new TestComponent());

        return kit.Component
            .then((Component) => {
                assert(Component instanceof TestComponent);
            });
    });

    it('decorate - wrapper', () => {

        let kit = Kit({
            Component: () => 'component'
        });

        kit.defineDecorator((value, name) => Promise.resolve().then(() => `${value} -> ${name}`));

        return kit.Component
            .then((Component) => {
                assert.equal(Component, 'component -> Component');
            })
    });

    it('clone', () => {

        class TestComponent {
        }

        let kit = Kit({
            Component: () => new TestComponent()
        });

        let kit2 = Kit(kit);

        return Promise.resolve()
            .then(() => {
                return Promise.all([kit.Component, kit2.Component])
                    .then(([c1, c2]) => {
                        assert(c1 instanceof TestComponent);
                        assert(c2 instanceof TestComponent);

                        assert.notEqual(c1, c2);
                    });
            });
    })

    it('keys', () => {
        let kit = Kit({
            User1: () => null,
            Name1: () => 'OK'
        });

        assert.deepEqual(Object.keys(kit), [
            'User1',
            'Name1',
            'set',
            'add',
            'get',
            'create',
            'remove',
            'defineDecorator']
        );
    })

    it('add via object', () => {
        let kit = Kit();

        kit.add({name: () => 'slava'});

        return kit.name.then((name) => assert.equal(name, 'slava'))


    })

});
```