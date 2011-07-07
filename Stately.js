/* 
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 * 
 * Copyright (c) 2011 Florian Schäfer (florian.schaefer@gmail.com)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 * 
 * Version: 0.9.8
 * 
 */

(function(exports){
    
    //the state machine engine
    var Stately = (function(undefined){
        
        //helper to identify options type
        var toString = Object.prototype.toString,
        
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
        function Stately (statesObject) {
            
            //current state of the machine
            var currentState,
            
            //storage for notification callbacks
            notificationStore = [],
            
            //notify callbacks about a transition
            notify = function () {
                
                //make copy of notification storage
                var notifications = notificationStore.slice ();
                
                //walk over stored callbacks
                for (var i = 0, l = notifications.length; i < l; i++) {
                    
                    //and notify them
                    notifications[i].apply (this, arguments);
                    
                }
            },
            
            //storage for machine states
            stateStore = {
                
                //evaluates the current state
                getMachineState: function getMachineState () {
                    
                    //return current state as string
                    return currentState.name;
                    
                },
                
                //function to transition into another state
                setMachineState: function setMachineState (nextState) {
                    
                    //store last machine state
                    var lastState = currentState;
                    
                    //if state machine cannot handle returned state
                    if (!nextState || !nextState.name || !stateStore[nextState.name]) {
                        
                        //throw invalid state exception
                        throw new InvalidStateError ('Stately.js: Transitioned into invalid state: `' + setMachineState.caller + '`.');
                        
                    }
                    
                    //transition into next state
                    currentState = nextState;
                    
                    //if state has changed
                    if (lastState !== nextState) {
                        
                        //notify notification callbacks about transition
                        notify.call (stateStore, arguments[1], lastState.name, nextState.name);
                        
                    }
                    
                    //return the state store
                    return this;
                    
                }
                
            },
            
            //the state machine
            stateMachine = {
                
                //copy function to public state machine object
                getMachineState: stateStore.getMachineState,
                
                //store a new notification callback
                bind: function (callback) {
                    
                    //if we have a new notification callback
                    if (callback) {
                    
                        //store it in notification storage
                        notificationStore.push (callback);
                    }
                    
                    //return the state machine
                    return this;
                },
                
                //remove a notification callback from storage
                unbind: function (callback) {
                    
                    //if no callback is given
                    if (!callback) {
                        
                        //reset notification storage
                        notificationStore = [];
                        
                    } else {
                        
                        //walk over stored callbacks
                        for (var i = 0, l = notificationStore.length; i < l; i++) {
                            
                            //if callback is found in notification storage
                            if (notificationStore[i] === callback) {
                                
                                //remove it
                                notificationStore.splice (i, 1);
                                
                                //and stop walking
                                break;
                                
                            }
                            
                        }
                        
                    }
                    
                    //return the state machine
                    return this;
                }
                
            },
            
            //event decorator factory function
            transition = function transition (stateName, eventName, nextEvent) {
                
                //the decorator
                return function () {
                    
                    //new state machine changed into
                    var nextState,
                    
                    //return the state machine if no event returns something
                    eventValue = stateMachine;
                    
                    //if attached event handler doesn't handle this event
                    if (stateStore[stateName] !== currentState) {
                        
                        //try other events in chain
                        if (nextEvent) {
                            
                            //let next event function handle this event
                            eventValue = nextEvent.apply (stateStore, arguments);
                        }
                        
                        //or return value of action
                        return eventValue;
                        
                    }
                    
                    //run action
                    eventValue = stateStore[stateName][eventName].apply (stateStore, arguments);
                    
                    //check return value of action
                    if (eventValue === undefined) {
                        
                        //nothing returned, stay in current state
                        nextState = currentState;
                        
                        //return state machine
                        eventValue = stateMachine;
                        
                    } else if (toString.call (eventValue) === '[object Object]') {
                        
                        //if state store object is returned ('this' in action function) stay in current state
                        nextState = (eventValue === stateStore ? currentState : eventValue);
                        
                        //return state machine
                        eventValue = stateMachine;
                        
                    } else if (toString.call (eventValue) === '[object Array]' && eventValue.length >= 1) {
                        
                        //else first element is next state
                        nextState = eventValue[0];
                        
                        //second element is return value
                        eventValue = eventValue[1];
                        
                    }
                    
                    //transition into next state
                    stateStore.setMachineState (nextState, eventName);
                    
                    //return desired value
                    return eventValue;
                    
                };
                
            };
            
            //walk over states object
            for (var stateName in statesObject) {
                
                //check own properties
                if (statesObject.hasOwnProperty (stateName)) {
                    
                    //store states in storage
                    stateStore[stateName] = statesObject[stateName];
                    
                    //walk over events
                    for (var eventName in stateStore[stateName]) {
                        
                        //check for own properties and type function
                        if (stateStore[stateName].hasOwnProperty (eventName) && toString.call (stateStore[stateName][eventName]) === '[object Function]') {
                            
                            //assign decorated events to state machine
                            stateMachine[eventName] = transition (stateName, eventName, stateMachine[eventName]);
                            
                        }
                        
                    }
                    
                    //attach states name to object in storage
                    stateStore[stateName].name = stateName;
                    
                    //initial state is the first passed in state
                    if (!currentState) {
                        
                        //make initial state the current state
                        currentState = stateStore[stateName];
                        
                    }
                    
                }
                
            }
            
            //if there is no initial state
            if (!currentState) {
                
                //throw invalid state exception
                throw new InvalidStateError ('Stately.js: Invalid initial state.');
                
            }
            
            //return the new state machine
            return stateMachine;
            
        }
        
        //a factory for new machines
        Stately.machine = function (statesObject) {
            return new Stately (statesObject);
        };
        
        //InvalidStateError exception
        Stately.InvalidStateError = InvalidStateError;
        
        //return the constructor
        return Stately;
        
    })();
    
    //export Stately object
    exports.Stately = Stately;
    
})(this);
