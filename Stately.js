/* 
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 * 
 * Copyright (c) 2011 Florian Schäfer (florian.schaefer@gmail.com)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 * 
 * Version: 0.9.7
 * 
 */

(function(exports){
    
    //the state machine engine
    var Stately = (function(undefined){
        
        //helper to idetify options type
        var toString = Object.prototype.toString,
        
        //custom exception for invalid events
        InvalidEventError = (function(){
            
            //custom event constructor
            function InvalidEventError (message) {
                
                //the error message
                this.message = message;
                
            }
            
            //inherit from error object
            InvalidEventError.prototype = new Error ();
            
            //return custom event
            return InvalidEventError;
            
        })(),
        
        //custom exception for invalid states
        InvalidStateError = (function(){
            
            //custom event constructor
            function InvalidStateError (message) {
                
                //the error message
                this.message = message;
                
            }
            
            //inherit from error object
            InvalidStateError.prototype = new Error ();
            
            //return custom event
            return InvalidStateError;
            
        })();
        
        //constructor
        function Stately (states, options) {
            
            //state machine default options
            var stateOptions = {
                
                //noop transition callback
                onTransition: function () {},
                
                //ignore invalid events
                invalidEventErrors: false
                
            },
            
            //current state of machine
            currentState,
            
            //store for states
            statesStore = {
                
                //evaluates current state
                getMachineState: function getMachineState () {
                    
                    //return current state as string
                    return currentState.name;
                    
                },
                
                //function to transition into another state
                setMachineState: function setMachineState (nextState) {
                    
                    //store last machine state
                    var lastState = currentState;
                    
                    //if state machine cannot handle returned state
                    if (!nextState || !nextState.name || !statesStore[nextState.name]) {
                        
                        //throw invalid state exception
                        throw new InvalidStateError ('Stately.js: Transitioned into invalid state: `' + setMachineState.caller + '`.');
                        
                    }
                    
                    //transition into next state
                    currentState = nextState;
                    
                    //if state has changed
                    if (lastState !== nextState) {
                        
                        //notify callback
                        stateOptions.onTransition.call (statesStore, undefined, lastState.name, nextState.name);
                        
                    }
                    
                    //return the state store
                    return this;
                    
                }
                
            },
            
            //the state machine
            stateMachine = {
                
                //copy function to public state machine object
                getMachineState: statesStore.getMachineState
                
            },
            
            //event decorator factory function
            transition = function transition (stateName, eventName, nextEvent) {
                
                //the decorator
                return function () {
                    
                    //indicates event is handled somewhere else in event chain
                    var eventHandled = false,
                    
                    //helper to store last state
                    lastState,
                    
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
                        
                        //if options ask for it and nothing handled this event
                        if (!eventHandled && stateOptions.invalidEventErrors) {
                            
                            //throw invalid event error
                            throw new InvalidEventError ('Stately.js: Invalid event: `' + eventName + '` for current state: `' + currentState.name + '`.');
                            
                        }
                        
                        //or return events return value
                        return eventValue;
                        
                    }
                    
                    //run event
                    eventValue = statesStore[stateName][eventName].apply (statesStore, arguments);
                    
                    //check return value of event
                    if (eventValue === undefined) {
                        
                        //nothing returned, stay in current state
                        nextState = currentState;
                        
                        //return state machine
                        eventValue = stateMachine;
                        
                    } else if (toString.call (eventValue) === '[object Object]') {
                        
                        //if stateStore object is returned (this in event function) stay in current state
                        nextState = (eventValue === statesStore ? currentState : eventValue);
                        
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
                        throw new InvalidStateError ('Stately.js: Transitioned into invalid state: `' + statesStore[stateName][eventName] + '`.');
                        
                    }
                    
                    //store last machine state
                    lastState = currentState;
                    
                    //transition into next state
                    currentState = nextState;
                    
                    //if state has changed
                    if (lastState !== nextState) {
                        
                        //notify callback
                        stateOptions.onTransition.call (statesStore, eventName, lastState.name, nextState.name);
                        
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
                
                //else walk over options object
                for (var option in options) {
                    
                    //own properties only
                    if (options.hasOwnProperty (option)) {
                        
                        //copy option
                        stateOptions[option] = options[option];
                        
                    }
                    
                }
                
            }
            
            //walk over states object
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
            
            //if there is no initial state
            if (!currentState) {
                
                //throw invalid state exception
                throw new InvalidStateError ('Stately.js: Invalid initial state.');
                
            }
            
            //notify callback about initial state
            stateOptions.onTransition.call (stateMachine, undefined, undefined, currentState.name);
            
            //return the new state machine
            return stateMachine;
            
        }
        
        //a factory for new machines
        Stately.machine = function (states, options) {
            return new Stately (states, options);
        };
        
        //InvalidEventError exception
        Stately.InvalidEventError = InvalidEventError;
        
        //InvalidStateError exception
        Stately.InvalidStateError = InvalidStateError;
        
        //return the constructor
        return Stately;
        
    })();
    
    //export stately object
    exports.Stately = Stately;
    
})(window);
