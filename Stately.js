/*
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 * 
 * Copyright (c) 2011 Florian Schäfer (florian.schaefer@gmail.com)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 *
 * Version: 0.9.0
 * 
 */
 
(function(exports){
    
    //helper to indetify options type
    var toString = Object.prototype.toString;
    
    //custom exception for a invalid event
    function InvalidEventError (message) {
        this.message = message;
    }
    
    //inherit from error object
    InvalidEventError.prototype = new Error ();
    
    //custom exception for a invalid state
    function InvalidStateError (message) {
        this.message = message;
    }
    
    //inherit from error object
    InvalidStateError.prototype = new Error ();
    
    //stately constructor
    var Stately = function (states, options) {
        
        //state machine default options
        var stateOptions = {
            onStateChange: new Function (),
            invalidEventErrors: false
        },
        
        //current state of the machine
        currentState,
        
        //store for states
        statesStore = {},
        
        //the state machine
        stateMachine = {
            
            //evaluates the current state
            getMachineState: function () {
                return currentState.name;
            }
            
        };
        
        //check for given options
        if (toString.call (options) === '[object Function]') {
            
            //if options is a function use it for state changes
            stateOptions.onStateChange = options;
            
        } else if (toString.call (options) === '[object Object]') {
            
            //else extend the default options
            for (var option in options) {
                
                //own properties only
                if (options.hasOwnProperty (option)) {
                    stateOptions[option] = options[option];
                }
                
            }
            
        }
        
        //walk over states
        for (var stateName in states) {
            
            //check own properties
            if (states.hasOwnProperty (stateName)) {
                
                //store states in store
                statesStore[stateName] = states[stateName];
                
                //walk over events
                for (var eventName in statesStore[stateName]) {
                    
                    //check own properties
                    if (statesStore[stateName].hasOwnProperty (eventName)) {
                        
                        //throw error if event already exists
                        if (stateMachine[eventName]) {
                            throw new TypeError ('Stately.js: Event already exists in this state machine: `' + eventName + '`.');
                        }
                        
                        //assign decorated events to state machine
                        stateMachine[eventName] = (function(stateName,eventName) {
                            
                            //the decorator
                            return function () {
                                
                                //if the current state doesn't handle the event
                                if (states[stateName] !== currentState) {
                                
                                    //throw an invalid event error if options ask for it
                                    if (stateOptions.invalidEventErrors) {
                                        throw new Stately.InvalidEventError ('Stately.js: Invalid event: `' + eventName + '` for current state: `' + currentState.name + '`.');
                                    }
                                    
                                    //or just return the state machine 
                                    return stateMachine;
                                }
                                
                                //run event and transition to next state
                                var nextState = statesStore[stateName][eventName].apply (statesStore, arguments),
                                
                                //store last change
                                lastState = currentState;
                                
                                //if state machine doesn't handle the returned state
                                if (!nextState || !nextState.name || !statesStore[nextState.name]) {
                                    
                                    //throw a invalid state exception
                                    throw new Stately.InvalidStateError ('Stately.js: Transitioned into invalid state: `' + statesStore[stateName][eventName] + '`.');
                                    
                                }
                                
                                //update current state
                                currentState = nextState;
                                
                                //notify state change function if the state has changed
                                if (lastState !== nextState) {
                                    stateOptions.onStateChange.call (stateMachine, eventName, lastState.name, nextState.name);
                                }
                                
                                //return the state machine
                                return stateMachine;
                            };
                            
                        })(stateName,eventName);
                        
                    }
                    
                }
                
                //attach states name to object in store
                statesStore[stateName].name = stateName;
                
                //initial state is the first passed in to stately
                if (!currentState) {
                    currentState = statesStore[stateName];
                }
                
            }
            
        }
        
        //return the new state machine
        return stateMachine;
    };
    
    //factory for new machines
    Stately.machine = function (states, options) {
        return new Stately (states, options);
    };
    
    //export custom exceptions
    Stately.InvalidEventError = InvalidEventError;
    Stately.InvalidStateError = InvalidStateError;
    
    //export stately object
    exports.Stately = Stately;
    
})(window);
