![Stately.js Logo](https://github.com/fschaefer/Stately.js/raw/master/misc/Stately.js.png)<br/>

## What is it?

Stately.js is a JavaScript based finite-state machine (FSM) engine inspired by phred's [stately](http://github.com/phred/stately).

## Example

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
