'use strict';

const constants = require("./constants");
const Alexa = require("alexa-sdk");
const IdleHandlers = require('./idleHandlers');
const FoundBookHandlers = require('./foundBookHandlers');
const ReadingBookHandlers = require('./readingBookHandlers');
const AudioEventHandlers = require('./audioEventHandlers');
const QuizHandlers = require('./quizHandlers');

const TOKEN = "a68de22efa58bc95b228024683";


exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = constants.appId;
    alexa.registerHandlers(StartHandlers, IdleHandlers, FoundBookHandlers, ReadingBookHandlers, QuizHandlers, AudioEventHandlers);
    alexa.dynamoDBTableName = constants.dynamoDBTableName;
    alexa.execute();
};


const StartHandlers = Alexa.CreateStateHandler(constants.states.START_MODE,  {
    'LaunchRequest': function () {
      this.handler.state = constants.states.IDLE_MODE;
      this.attributes['api_token'] = TOKEN;
      this.attributes['level'] = "";
      this.emit(':ask', 'Hi! Welcome to LanguaBooks! What would you like to do?', 'What would you like to do?');
    }
});