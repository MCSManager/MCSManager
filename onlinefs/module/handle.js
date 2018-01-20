const EventEmitter = require("events");


class ControllerHandle extends EventEmitter {
    constructor(args) {
        super(args);
    }

    listener(event, ...agrs) {
        this.on(event, agrs);
    }

    notify(event, ...args) {
        this.emit(event, args);
    }
}


const onlyControllerHandle = new ControllerHandle();

exports.ControllerHandle = onlyControllerHandle;