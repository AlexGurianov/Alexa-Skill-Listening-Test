'use strict';

const constants = require("./constants");
const Alexa = require("alexa-sdk");
const utilities = require("./utilities");
const BooksGetter = require('./booksGetter');


const FoundBookHandlers = Alexa.CreateStateHandler(constants.states.FOUND_BOOK_MODE, {
    'LaunchRequest': function () {
      this.emit(':ask', 'Hi! Welcome to LanguaBooks! You have picked the book <break time="200ms"/>' + this.attributes['picked_book_title'] +
        '<break time="100ms"/>. Say play to play the book',
        'What would you like to do?');
    },
    'AMAZON.StopIntent': function() {
      console.log("amazon.StopIntent intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
    },
    'SessionEndedRequest': function () {
      console.log("session ended intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
    },
    'AMAZON.HelpIntent': function() {
      let help_text = `<p> You can say play to play the book you picked. </p>
        <p> You can ask Languabooks to list books available to you like this: what books do you have? Or you can specify a category: do you have books about family? </p>
        <p> To find another book say find and book title. </p>`;
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
    'play_found_book': function () {
      console.log("play_found_book intent fired " + this.attributes['picked_book_title']);
      let that = this;
      BooksGetter.read_book_contents(this.attributes['api_token'], this.attributes['picked_book_id'], function (pages_urls, questions_urls) {
        that.attributes['pages_urls'] = pages_urls;
        that.attributes['questions_urls'] = questions_urls;
        that.handler.state = constants.states.READING_MODE;
        utilities.audio_controller.startFromBeginning.call(that);
      });
    },
    'Unhandled': function() {
        console.log("unhandled intent fired (found_book_mode)");
        console.log(this.event.request.type);
        console.log(this.event);
        if (this.event.request.type === 'System.ExceptionEncountered') {
          console.log(this.event.request.error.type);
          console.log(this.event.request.error.message);
        }
        this.emit(':ask', "Sorry. I don't understand", "What would you like to do?");
    }
});


module.exports = FoundBookHandlers;