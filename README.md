![Stately.js Logo](https://github.com/fschaefer/Stately.js/raw/master/misc/Stately.js.png)

## What is it?

Stately.js is a JavaScript based finite-state machine (FSM) or finite-state automaton engine inspired by phred's [stately](http://github.com/phred/stately).

## Usage

### Creating a new machine

A new state machine can be created with either the new operator:

    var machine = new Stately(statesObject);

or the factory method:

    var machine = Stately.machine(statesObject);

Both will return a new `stateMachine` object, with all events from all states attached to it. The machine will transition into the initial state (the first attached `stateObject`) immediately. In addition to the events the `stateMachine` object has a `getMachineState()` method, returning the current name of the machines state, and `bind()` and `unbind()` methods, to register callbacks to receive `notifications` when the machine transitions into another state.

The `statesObject` is an object  with `stateObject` objects attached as properties.
The property names of the `statesObject` are the `states` of the machine. The attached `stateObject` objects model the machines states with the property names as `events` and the connected functions as `actions`:

    var machine = Stately.machine({
        'STATE0': {
            event: function () {
                ...
            }
        },
        'STATE1': {
            event: function () {
                ...
            }
        },
        'STATE2':{
            event: function () {
                ...
            },
            anotherEvent: function () {
                ...
            }
        }
    });

If different states use the same event identifier, the `events` are chained up and the machine handles calling the correct `action` for the current state (if the `event` is handled in the current state). If the event is not handled in the current state, it is ignored.

If no immediate `action` needs to be declared, the desired transition `state` can be attached to the `event` as string directly:
   
    var machine = Stately.machine({
        'STATE0': {
            'event':        /* => */ 'STATE1'
        },
        'STATE1': {
            'event':        /* => */ 'STATE2'
        },
        'STATE2': {
            'event':        /* => */ 'STATE0',
            'anotherEvent': /* => */ 'STATE1'
        }
    });

### Transitions

There are several ways an `action` can transition the machine into another state. The simplest form is returning the desired next state from an action. Therefore, `this` refers to the (internal) `stateStore` inside an `action` to access the other states of the machine:

    ...
    
    'STATE1': {
        doSomething: function () {
            
            ...
            
            //transition from STATE1 to STATE2
            return this.STATE2;
        }
    }
    
    ...

If an action should not transition the machine into another state, just omit the return value (or return the current state).

Sometimes it is desired to return a value from an action. In this case the return value must be an array with two elements. The first element is the next state the machine should transition into, and the second element the return value:

    ...
    
    'STATE1': {
        doSomething: function () {
            
            ...
            
            //transition from STATE1 to STATE2 and return a string
            return [this.STATE2, 'this is a return value'];
        }
    }
    
    ...

For asynchronous actions there are `getMachineState()` and  `setMachineState(nextState)` accessible through the `this` reference of an action:

    ...
    
    'STATE1': {
        doSomething: function () {
            var self = this;
            
            setTimeout(function () {
                
                ...
                
                self.setMachineState(self.STATE2);
            }, 5000);
            
            ...
            
        }
    }
    
    ...

Because `this` refers to the `stateStore`, it is also possible to call an action from another state (note: this won't trigger the `notification` callbacks):

    ...
    
    'STATE1': {
        doSomething: function () {
            
            ...
            
            this.STATE2.doSomethingDifferent.call(this);
            
            ...
            
            return this.STATE3.doSomethingCompletelyDifferent.call(this);
        }
    }
    
    ...

### Notifications

Once in a while, it is useful to get a `notification` when the machine transitions into another state. Therefore the `stateMachine` object has `bind(callback)` and `unbind(callback)` to register and unregister notification handlers that get called when the state changes. A notification callback has the following form: 

    function notification (event, oldState, newState) {
        ...
    }

`event` - The event that triggered the transition.
`oldState` - The old state the machine is transitioned from.
`newState` - The new state the machine is transitioned into.

Inside the `notification`, `this` refers to the internal `stateStore`.

### Hooks

Beside the notification system via `bind` and `unbind`, there is an alternative way to attach hooks that are triggered when the state of the machine changes. Possible hooks are `onbeforeSTATE`, `onenterSTATE` (or as shortcut `onSTATE`) and `onleaveSTATE` for states and `onbeforeEVENT` and `onafterEVENT` for events. Hook functions have the same signature as notifications bound with `bind`.

## Examples

### Door

    var door = Stately.machine({
        'OPEN': {
            'close':  /* => */ 'CLOSED'
        },
        'CLOSED': {
            'open':   /* => */ 'OPEN',
            'lock':   /* => */ 'LOCKED'
        },
        'LOCKED': {
            'unlock': /* => */ 'CLOSED',
            'break':  /* => */ 'BROKEN'
        },
        'BROKEN': {
            'fix': function () {
                this.fixed = (this.fixed === undefined ? 1 : ++this.fixed);
                return this.fixed < 3 ? this.OPEN : this.BROKEN;
            }
        }
    });
    
    //the initial state of the door is open (it's the first state object)
    console.log(door.getMachineState() === 'OPEN');        // true;
    
    //close and lock the door
    door.close().lock();
    console.log(door.getMachineState() === 'LOCKED');      // true;
    
    //try to open it
    door.open();
    console.log(door.getMachineState() === 'OPEN');        // false;
    
    //unlock, open, lock (is ignored because it fails), close, and lock
    door.unlock().open().lock().close().lock();
    console.log(door.getMachineState() === 'LOCKED');      // true;
    
    //the door is still locked, break it
    door.break();
    console.log(door.getMachineState() === 'BROKEN');      // true;
    
    //fix opens the door, close it, lock it, break it again
    door.fix().close().lock().break();
    console.log(door.getMachineState() === 'BROKEN');      // true;
    
    //and again fix opens the door, close it, lock it, break it
    door.fix().close().lock().break();
    console.log(door.getMachineState() === 'BROKEN');      // true;
    
    //fixing is limited, the door stays broken
    door.fix();
    console.log(door.getMachineState() === 'OPEN');        // false;
    console.log(door.getMachineState() === 'BROKEN');      // true;

### Radio

    var radio = Stately.machine({
        'STOPPED': {
            play: function () {
                return this.PLAYING;
            }
        },
        'PLAYING': {
            stop: function () {
                return this.STOPPED;
            },
            pause: function () {
                return this.PAUSED;
            }
        },
        'PAUSED': {
            play: function () {
                return this.PLAYING;
            },
            stop: function () {
                return this.STOPPED;
            }
        }
    }).bind(function (event, oldState, newState) {
        
        var transition = oldState + ' => ' + newState;
        
        switch (transition) {
            /*
            ...
            case 'STOPPED => PLAYING':
            case 'PLAYING => PAUSED':
            ...
            */
            default:
                console.log(transition);
                break;
        }
    });
    
    radio.play().pause().play().pause().stop();
    //STOPPED => PLAYING
    //PLAYING => PAUSED
    //PAUSED => PLAYING
    //PLAYING => PAUSED
    //PAUSED => STOPPED

### Radio (more declarative)

    var radio = Stately.machine({
        'STOPPED': {
            'play': /* => */ 'PLAYING'
        },
        'PLAYING': {
            'stop':  /* => */ 'STOPPED',
            'pause': /* => */ 'PAUSED'
        },
        'PAUSED': {
            'play': /* => */ 'PLAYING',
            'stop': /* => */ 'STOPPED'
        }
    });

    radio.onleaveSTOPPED = function (event, oldState, newState) {
        // ...
    };

    radio.onenterSTOPPED = function (event, oldState, newState) {
        // ...
    };

    radio.onPLAYING = function (event, oldState, newState) {
        // ...
    };

    radio.onPAUSED = function (event, oldState, newState) {
        // ...
    };

## jsFiddles
* http://jsfiddle.net/2bJgM/
