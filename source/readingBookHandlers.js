'use strict';

const constants = require("./constants");
const Alexa = require("alexa-sdk");
const utilities = require("./utilities");


const ReadingBookHandlers = Alexa.CreateStateHandler(constants.states.READING_MODE, {
    'LaunchRequest': function () {
      if (this.attributes['playbackFinished'])
        this.emit(':ask', 'Hi! Welcome to LanguaBooks! You have listened to a book ' + this.attributes['picked_book_title'] + '. You can say next to start the quiz or restart to listen again', 'What would you like to do?');
      else
        this.emit(':ask', 'Hi! Welcome to LanguaBooks! You have been listening to a book ' + this.attributes['picked_book_title'] + '. You can say resume, restart or stop', 'What would you like to do?');
    },
    'SessionEndedRequest': function () {
      console.log("session ended intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
    },
    'AMAZON.HelpIntent': function() {
      let help_text = `<p> You can say resume to play book from where you left </p>
        <p> To stop playing say stop </p>
        <p> To listen from the beginning say restart </p>
        <p> Say Alexa, next when you want to go to quiz. Then say begin </p>`;
      this.emit(':ask', help_text, 'What would you like to do?');
    },
    'list_books': function() {
      this.handler.state = constants.states.IDLE_MODE;
      this.emitWithState('list_books');
    },
    'find_book': function () {
      this.handler.state = constants.states.IDLE_MODE;
      this.emitWithState('find_book');
    },
    'pick_random_book': function () {
      this.handler.state = constants.states.IDLE_MODE;
      this.emitWithState('pick_random_book');
    },
    'set_level': function () {
      this.handler.state = constants.states.IDLE_MODE;
      this.emitWithState('set_level');
    },
    'play_found_book': function () { utilities.audio_controller.play.call(this) },
    'AMAZON.PauseIntent' : function () { utilities.audio_controller.stop.call(this) },
    'AMAZON.StopIntent' : function () { utilities.audio_controller.stop.call(this) },
    'AMAZON.CancelIntent' : function () { utilities.audio_controller.stop.call(this) },
    'AMAZON.ResumeIntent' : function () { utilities.audio_controller.play.call(this) },
    'AMAZON.StartOverIntent' : function () { utilities.audio_controller.startFromBeginning.call(this) },
    'AMAZON.NextIntent': function() {
      this.response.audioPlayerStop();
      this.handler.state = constants.states.QUIZ_MODE;
      this.attributes['question_index'] = 0;
      this.attributes['correct_answers'] = 0;
      this.response.speak('Now let\'s answer some questions. Say begin to start the quiz.').listen('Say begin to begin the quiz.');
      this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log("unhandled intent fired (reading_mode)");
        console.log(this.event.request.type);
        console.log(this.event);
        if (this.event.request.type === 'System.ExceptionEncountered') {
          console.log(this.event.request.error.type);
          console.log(this.event.request.error.message);
        }
        this.emit(':ask', "Sorry. I don't understand", "What would you like to do?");
    }
});


module.exports = ReadingBookHandlers;