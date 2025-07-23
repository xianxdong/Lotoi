class VoiceConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = "VoiceConnectionError";
    }
}

class EmptyQueueList extends Error {
    constructor(message) {
        super(message);
        this.name = "EmptyQueueList";
    }
}

class LinkNotFound extends Error {
    constructor(message) {
        super(message);
        this.name = "LinkNotFound";
    }
}


module.exports = { VoiceConnectionError, EmptyQueueList, LinkNotFound };