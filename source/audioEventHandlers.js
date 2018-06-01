'use strict';

const constants = require("./constants");
const Alexa = require('alexa-sdk');


const AudioEventHandlers = Alexa.CreateStateHandler(constants.states.READING_MODE, {
    'PlaybackStarted' : function () {
        console.log('playbackStarted');
        this.attributes['token'] = getToken.call(this);
        this.attributes['index'] = getIndex.call(this);
        this.emit(':saveState', true);
    },
    'PlaybackFinished' : function () {
        console.log('playbackFinished');
        this.attributes['enqueuedToken'] = false;
        if (parseInt(this.attributes['index']) == (this.attributes['pages_urls'].length - 1))
            this.attributes['playbackFinished'] = true;
        this.emit(':saveState', true);
    },
    'PlaybackStopped' : function () {
        console.log('playbackStopped');
        this.attributes['token'] = getToken.call(this);
        this.attributes['index'] = getIndex.call(this);
        this.attributes['offsetInMilliseconds'] = getOffsetInMilliseconds.call(this);
        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished' : function () {
        console.log('playbacknearlyFinished');

        if (this.attributes['enqueuedToken']) 
            return this.context.succeed({
                    "version": "1.0",
                    "sessionAttributes": {},
                    "response": {
                        "shouldEndSession": true,
                        "outputSpeech": null,
                        "card": null,
                        "reprompt": null,
                        "directives": null
                    }
                });
        
        let enqueueIndex = this.attributes['index'];
        enqueueIndex += 1;
        
        if (enqueueIndex === this.attributes['pages_urls'].length)
            return this.context.succeed({
                    "version": "1.0",
                    "sessionAttributes": {},
                    "response": {
                        "shouldEndSession": true,
                        "outputSpeech": null,
                        "card": null,
                        "reprompt": null,
                        "directives": null
                    }
                });

        this.attributes['enqueuedToken'] = this.attributes['pages_urls'][enqueueIndex];

        var enqueueToken = this.attributes['enqueuedToken'];
        var playBehavior = 'ENQUEUE';
        var expectedPreviousToken = this.attributes['token'];
        var offsetInMilliseconds = 0;
        
        this.response.audioPlayerPlay(playBehavior, enqueueToken, enqueueToken, expectedPreviousToken, offsetInMilliseconds);
        this.emit(':responseReady');
    },
    'PlaybackFailed' : function () {
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed({});
    }
});


module.exports = AudioEventHandlers;

function getToken() {
    return this.event.request.token;
}

function getIndex() {
    var tokenValue = this.event.request.token;
    return this.attributes['pages_urls'].indexOf(tokenValue);
}

function getOffsetInMilliseconds() {
    return this.event.request.offsetInMilliseconds;
}