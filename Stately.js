/*
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 * 
 * Copyright (c) 2011 Florian Schäfer (florian.schaefer@gmail.com)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 *
 * Version: 0.9.6
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
            onTransition: function () {},
            invalidEventErrors: false
        },
        
        //current state of machine
        currentState,
        
        //store for states
        statesStore = {},
        
        //the state machine
        stateMachine = {
            
            //evaluates current state
            getMachineState: function () {
                return currentState.name;
            }
            
        },
        
        //event decorator factory function
        transition = function (stateName, eventName, nextEvent) {
            
            //the decorator
            return function () {
                
                //indicates event is handled somewhere else in event chain
                var eventHandled = false,
                
                //store last machine state
                lastState = currentState,
                
                //new state machine changed into
                nextState,
                
                //return the state machine if no event returns something
                eventValue = stateMachine;
                
                //if atteched event handler doesn't handle this event
                if (states[stateName] !== currentState) {
                    
                    //try other events in chain
                    if (nextEvent) {
                        
                        //let next event function handle this event
                        eventValue = nextEvent.apply (statesStore, arguments);
                        
                        //event is handled
                        eventHandled = true;
                        
                    }
                    
                    //throw invalid event error if options ask for it and nothing handled this event
                    if (!eventHandled && stateOptions.invalidEventErrors) {
                        throw new Stately.InvalidEventError ('Stately.js: Invalid event: `' + eventName + '` for current state: `' + currentState.name + '`.');
                    }
                    
                    //or return events return value
                    return eventValue;
                }
                
                //run event
                eventValue = statesStore[stateName][eventName].apply (statesStore, arguments);
                
                //check if return value of event is an object or array
                if (toString.call (eventValue) === '[object Object]') {
                    
                    //assume object is next state
                    nextState = eventValue;
                    
                    //return state machine
                    eventValue = stateMachine;
                    
                } else if (toString.call (eventValue) === '[object Array]' && eventValue.length >= 1) {
                    
                    //else first element is next state
                    nextState = eventValue[0];
                    
                    //second element is return value
                    eventValue = eventValue[1];
                    
                }
                
                //if state machine cannot handle returned state
                if (!nextState || !nextState.name || !statesStore[nextState.name]) {
                    
                    //throw invalid state exception
                    throw new Stately.InvalidStateError ('Stately.js: Transitioned into invalid state: `' + statesStore[stateName][eventName] + '`.');
                    
                }
                
                //transition into next state
                currentState = nextState;
                
                //if state has changed
                if (lastState !== nextState) {
                    
                    //notify callback
                    stateOptions.onTransition.call (stateMachine, eventName, lastState.name, nextState.name);
                    
                }
                
                //return desired value
                return eventValue;
            };
            
        };
        
        //handle given options
        if (toString.call (options) === '[object Function]') {
            
            //if options is a function use it for state changes
            stateOptions.onTransition = options;
            
        } else if (toString.call (options) === '[object Object]') {
            
            //else extend default options
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
                    
                    //check for own properties and function
                    if (statesStore[stateName].hasOwnProperty (eventName) && toString.call (statesStore[stateName][eventName]) === '[object Function]') {
                        
                        //assign decorated events to state machine
                        stateMachine[eventName] = transition (stateName, eventName, stateMachine[eventName]);
                        
                    }
                    
                }
                
                //attach states name to object in store
                statesStore[stateName].name = stateName;
                
                //initial state is the first passed in to stately
                if (!currentState) {
                    
                    //make initial state the current state
                    currentState = statesStore[stateName];
                    
                }
                
            }
            
        }
        
        //notify callback about initial state
        stateOptions.onTransition.call (stateMachine, undefined, undefined, currentState.name);
        
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
    
})(window,undefined);
