//the testing framework
var test = {

    //the actual tests to perform
    tests: [
        {
            name: 'Create basic finite state machine.',
            method: function () {

                var simple = Stately.machine({
                    'TEST': {
                        test: function () {
                            return this.TEST;
                        }
                    }
                });

                this.assert(simple, 'Create a very basic finite state machine.');
                this.assert(typeof simple.test === 'function', 'Expect events to be exported.');
                this.assert(simple.getMachineState() === 'TEST', 'Report initial state.');
                this.assert(typeof simple.test() === 'object', 'Event returns the current state object.');
                this.assert(simple.getMachineState() === 'TEST', 'Report new state.');
            }
        },
        {
            name: 'Basic transitions with strings.',
            method: function () {

                var door = Stately.machine({
                    'OPEN': {
                        close: 'CLOSED'
                    },
                    'CLOSED': {
                        open: 'OPEN'
                    }
                });

                this.assert(door, 'Create finite state machine.');
                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
                this.assert(door.getMachineEvents().length === 1, 'Report number of events.');
                this.assert(door.getMachineEvents()[0] === 'close', 'Report number of events.');
                this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into new state.');
                this.assert(door.open().getMachineState() === 'OPEN', 'Transition into anoter state.');
            }
        },
        {
            name: 'Epsilon transitions.',
            method: function () {

                var door = Stately.machine({
                    'OPEN': {
                        close: function () {
                            //epsilon transition with calling other states event function;
                            //will call the events function but won't call the notification callbacks
                            return this.CLOSED.open.call(this);
                        }
                    },
                    'CLOSED': {
                        open: function () {
                            return this.OPEN;
                        }
                    }
                });

                this.assert(door, 'Create finite state machine.');
                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
                this.assert(door.close().getMachineState() === 'OPEN', 'Transition into new state.');

                door = Stately.machine({
                    'OPEN': {
                        close: function () {
                            //epsilon transition without calling other states event;
                            //will do a regular transform into the other state
                            this.setMachineState(this.CLOSED);
                        }
                    },
                    'CLOSED': {
                        open: function () {
                            return this.OPEN;
                        }
                    }
                });

                this.assert(door, 'Create finite state machine.');
                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
                this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into new state.');
            }
        },
        {
            name: 'Special event hook functions.',
            method: function () {

                var onEnter,
                    onLeave,
                    onBeforeClose,
                    onAfterClose

                door = Stately.machine({
                    'OPEN': {
                        onEnter: function () {
                            onEnter = arguments[0] === "open" && arguments[1] === "CLOSED" && arguments[2] === "OPEN";
                        },
                        onLeave: function () {
                            onLeave = arguments[0] === "close" && arguments[1] === "OPEN" && arguments[2] === "CLOSED";
                        },
                        onBeforeClose: function () {
                            onBeforeClose = arguments[0] === "close" && arguments[1] === "OPEN" && arguments[2] === "OPEN";
                        },
                        close: function () {
                            return this.CLOSED;
                        },
                        onAfterClose: function () {
                            onAfterClose = arguments[0] === "close" && arguments[1] === "OPEN" && arguments[2] === "CLOSED";
                        }
                    },
                    'CLOSED': {
                        open: function () {
                            return this.OPEN;
                        }
                    }
                });

                this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into a new state.');
                this.assert(door.open().getMachineState() === 'OPEN', 'Transition into a new state.');
                this.assert(onEnter === true, 'Report correct event 1');
                this.assert(onLeave === true, 'Report correct event 2');
                this.assert(onBeforeClose === true, 'Report correct event 3');
                this.assert(onAfterClose === true, 'Report correct event 4');
            }
        },
        {
            name: 'Exceptions.',
            method: function () {

                var door = Stately.machine({
                    'OPEN': {
                        close: function () {
                            return this.CLOSED;
                        }
                    },
                    'CLOSED': {
                        open: function () {
                            return {}; //invalid state;
                        }
                    }
                }),

                errorReportOk = false;

                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');

                door.close();

                try {
                    door.open();
                } catch (ex) {
                    errorReportOk = (ex instanceof Stately.InvalidStateError);
                }

                this.assert(errorReportOk, 'Report InvalidStateError.');

                //ignore invalid events
                door = Stately.machine({
                    'OPEN': {
                        close: function () {
                            return this.CLOSED;
                        }
                    },
                    'CLOSED': {
                        open: function () {
                            return this.OPEN;
                        }
                    }
                });

                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
                this.assert(door.open(), 'Ignore invalid event in current state.');

            }
        },
        {
            name: 'Return values of actions.',
            method: function () {

                var door = Stately.machine({
                    'OPEN': {
                        close: function () {
                            return [this.CLOSED, 'the door is closed'];
                        },
                        next1: function () {},
                        next2: function () {
                            return this;
                        },
                        next3: function () {
                            return this.CLOSED;
                        }
                    },
                    'CLOSED': {
                        reset: function () {
                            return this.OPEN;
                        }
                    }
                });

                this.assert(door, 'Create finite state machine.');
                this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
                this.assert(door.close() === 'the door is closed', 'Check return value of action.');
                this.assert(door.getMachineState() === 'CLOSED', 'Report new state.');
                this.assert(door.reset().next1().getMachineState() === 'OPEN', 'Stay in state.');
                this.assert(door.reset().next2().getMachineState() === 'OPEN', 'Stay in state.');
                this.assert(door.reset().next3().getMachineState() === 'CLOSED', 'Report new state.');
            }
        }
    ],

    //measures the time of an action
    time: function (action) {
        var start = new Date();
        action();
        var total = new Date() - start;
        return total;
    },

    //prepares the framework
    init: function () {

        //set the defaults
        var self = this;
        self.index = 0;
        self.errors = [];
        self.target = document.getElementById('results');
        self.total = 0;
        self.tests = 0;

        //tracks test attempts
        this.assert = function (ok, msg) {
            self.tests++;
            if (ok) { return; }
            self.errors.push(msg);
        };

        //displays the final count
        var showTotal = function () {
            self.target.innerHTML += '<h4>Total Tests: ' + self.total + '</h4>';
        };

        //handles doing the actual work for tests
        var performTest = function () {
            var next = test.tests[self.index];
            if (next == null || next.name == null || next.name.length == 0) {
                showTotal();
                return;
            }

            //reset
            self.errors = [];

            //try the method
            var count = null;
            try {
                count = test.time(function () {
                    test.tests[self.index].method.apply(this);
                });
            } catch (e) {
                self.errors.push('Exception: ' + e);
            }

            //if not okay, display the errors
            var result = ['<div class="result result-'];
            if (self.errors.length > 0) {
                result.push('error" >');
                result.push('<div class="result-title">#' + (self.index + 1) + ': ' + test.tests[self.index].name  + ' :: ' + self.tests + ' tests (' + count + 'ms)</div>');
                result.push('<div class="result-errors" >' + self.errors.join('<br />') + '</div>');
            } else {
                result.push('success" >');
                result.push('<div class="result-title">#' + (self.index + 1) + ': ' + test.tests[self.index].name  + ' :: ' + self.tests + ' tests (' + count + 'ms)</div>');
            }
            result.push('</div>');
            self.target.innerHTML += result.join('');

            //set the next test
            self.index++;
            self.total += self.tests;
            self.tests = 0;
            if (self.index >= test.tests.length) {
                showTotal();
                return;
            }
            setTimeout(performTest, 1);

        };

        //start the tests
        performTest();

    }

};

//start the testing framework
setTimeout(test.init, 100);
