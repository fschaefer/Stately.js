//the testing framework 
var test = {
    
    //the actual tests to perform
    tests:[
        { name:"Create basic finite state machine.", method:function () {
            
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
            
        }},
        { name:"Basic transitions.", method:function () {
            
            var door = Stately.machine({
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
            
            this.assert(door, 'Create finite state machine.');
            this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
            this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into new state.');
            this.assert(door.open().getMachineState() === 'OPEN', 'Transition into anoter state.');
            
        }},
        { name:"Epsilon transitions.", method:function () {
            
            var door = Stately.machine({
                'OPEN': {
                    close: function () {
                        //epsilon transition with calling other states event function;
                        //will call the events function but won't call the onTransition handler
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
            
        }},
        { name:"Monitor transitions.", method:function () {
            
            var transitionedEvent = false,
            transitionedOldstate = false,
            transitionedNewstate = false;
            
            var door = Stately.machine({
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
            }, function (event, oldstate, newstate) {
                
                transitionedEvent = event;
                transitionedOldstate = oldstate;
                transitionedNewstate = newstate;
                
            });
            
            this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into new state.');
            this.assert(transitionedEvent === 'close', 'Report correct event');
            this.assert(transitionedOldstate === 'OPEN', 'Report initial state.');
            this.assert(transitionedNewstate === 'CLOSED', 'Report target state.');
            
            transitionedEvent = false,
            transitionedOldstate = false,
            transitionedNewstate = false;
            
            //repeat with options.onTransition
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
            }, {
                onTransition: function (event, oldstate, newstate) {
                    
                    transitionedEvent = event;
                    transitionedOldstate = oldstate;
                    transitionedNewstate = newstate;
                    
                }
            });
            
            this.assert(door.close().getMachineState() === 'CLOSED', 'Transition into new state.');
            this.assert(transitionedEvent === 'close', 'Report correct event');
            this.assert(transitionedOldstate === 'OPEN', 'Report initial state.');
            this.assert(transitionedNewstate === 'CLOSED', 'Report target state.');
            
        }},
        { name:"Use exceptions to report errors.", method:function () {
            
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
            }, {
                invalidEventErrors: true
            });
            
            this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
            
            //transition into invalid state
            var errorReportOk;
            
            try {
                door.open();
            } catch (ex) {
                errorReportOk = (ex instanceof Stately.InvalidEventError);
            }
            
            this.assert(errorReportOk, 'Report InvalidEventError.');
            
            //return invalid state
            errorReportOk = false;
            
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
            }, {
                invalidEventErrors: false //explicit here (default)
            });
            
            this.assert(door.getMachineState() === 'OPEN', 'Report initial state.');
            this.assert(door.open(), 'Ignore invalid event in current state.');
            
        }},
        { name:"Event return values.", method:function () {
            
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
            this.assert(door.close() === 'the door is closed', 'Return value of event.');
            this.assert(door.getMachineState() === 'CLOSED', 'Report new state.');
            this.assert(door.reset().next1().getMachineState() === 'OPEN', 'Stay in state.');
            this.assert(door.reset().next2().getMachineState() === 'OPEN', 'Stay in state.');
            this.assert(door.reset().next3().getMachineState() === 'CLOSED', 'Report new state.');
            
        }}
    ],
    
    //measures the time of an action
    time:function(action) {
        var start = new Date();
        action();
        var total = new Date() - start;
        return total;
    },
    
    //prepares the framework
    init:function() {
        
        //set the defaults
        var self = this;
        self.index = 0;
        self.errors = [];
        self.target = document.getElementById("results");
        self.total = 0;
        self.tests = 0;
        
        //tracks test attempts
        this.assert = function(ok, msg) {
            self.tests++;
            if (ok) { return; }
            self.errors.push(msg);
        };
        
        //displays the final count
        var showTotal = function() {
            self.target.innerHTML += "<h4>Total Tests: " + self.total + "</h4>";
        };
        
        //handles doing the actual work for tests
        var performTest = function() {
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
                count = test.time(function() { 
                    test.tests[self.index].method.apply(this);
                });
            }
            catch (e) {
                self.errors.push("Exception: " + e);
            }
            
            //if not okay, display the errors
            var result = ["<div class='result result-"];
            if (self.errors.length > 0) {
                result.push("error' >");
                result.push("<div class='result-title'>#" + (self.index + 1) + ": " + test.tests[self.index].name  + " :: " + self.tests + " tests (" + count + "ms)</div>");
                result.push("<div class='result-errors' >" + self.errors.join("<br />") + "</div>");
            }
            else {
                result.push("success' >");
                result.push("<div class='result-title'>#" + (self.index + 1) + ": " + test.tests[self.index].name  + " :: " + self.tests + " tests (" + count + "ms)</div>");
            }
            result.push("</div>");
            self.target.innerHTML += result.join("");
            
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
