![Stately.js Logo](https://github.com/fschaefer/Stately.js/raw/master/misc/Stately.js.png)

## What is it?

Stately.js is a JavaScript based finite-state machine (FSM) engine inspired by phred's [stately](http://github.com/phred/stately).

## Usage

You can create a new state machine with either `new Stately(statesObject, [options])` or the factory method `Stately.machine(statesObject, [options])`.

The `statesObject` is a plain object with `stateObject` objects attached to properties.
The keys of the `statesObject` are the `states` of the machine. The attached `stateObject` objects model the machines states.

There are two options you can feed into the optional `options` object:

One is the `onTransition` option, to attach a callback that gets called when the machine transitioned into another state: `{ onTransition: function (event, oldstate, newstate) {} }`. If no other settings are needed you can feed in the `callback` directly, instead of the `options` object.

The other one is the `invalidEventErrors` option, that will let the machine throw a `Stately.InvalidEventError` exception, if an event is called that is not available in the current machine state: `{ invalidEventErrors: true }`.

## Examples

    var door = Stately.machine ({
        'OPEN': {
            close: function () {
                return this.CLOSED;
            }
        },
        'CLOSED': {
            open: function () {
                return this.OPEN;
            },
            lock: function () {
                return this.LOCKED;
            }
        },
        'LOCKED': {
            unlock: function () {
                return this.CLOSED;
            },
            break: function () {
                return this.BROKEN;
            }
        },
        'BROKEN': {
            fix: function () {
                this.fixed = (this.fixed === undefined ? 1 : ++this.fixed);
                return this.fixed < 3 ? this.OPEN : this.BROKEN;
            }
        }
    });

    //the initial state of the door is open(it's the first state object)
    console.log(door.getMachineState() === 'OPEN');        // true;

    //close and lock the door
    door.close().lock();
    console.log(door.getMachineState() === 'LOCKED');      // true;

    //try to open it
    door.open();
    console.log(door.getMachineState() === 'OPEN');        // false;

    //unlock, open, lock(is ignored because it fails), close, and lock
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

<br/>

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
    }, function (event, oldstate, newstate) {

        var transition = oldstate + ' => ' + newstate;

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
    //undefined => STOPPED
    //STOPPED => PLAYING
    //PLAYING => PAUSED
    //PAUSED => PLAYING
    //PLAYING => PAUSED
    //PAUSED => STOPPED

