'use strict';

const constants = require("./constants");
const BooksGetter = require('./booksGetter');
const Alexa = require('alexa-sdk');


const option_letters = ['A', 'B', 'C', 'D', 'E', 'F'];


const QuizHandlers = Alexa.CreateStateHandler(constants.states.QUIZ_MODE, {
    'LaunchRequest': function () {
      this.emit(':ask', 'Hi! Welcome to LanguaBooks! You are in quiz mode now. You can say restart to listen to the book ' + this.attributes['picked_book_title'] + ' again. Say begin to go on with the quiz.',
       'What would you like to do?');
    },
    'SessionEndedRequest': function () {
      console.log("session ended intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
    },
    'AMAZON.HelpIntent': function() {
    let help_text = `<p> Say begin to start the quiz or continue where you left off </p>
      <p> Listen to the question and given options and respond with a letter </p>
      <p> Say repeat to hear the question one more time </p>
      <p> You can say restart to listen to the book again </p>
      <p> You can also pick a new book at any moment </p>`;
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
    'AMAZON.StartOverIntent' : function () { 
      this.handler.state = constants.states.READING_MODE;
      this.emitWithState('AMAZON.StartOverIntent');
    },
    'quiz' : function() {
      console.log(this.event);
      if (this.event.request.dialogState == 'COMPLETED') {
        let answer_index = this.attributes['allowed_answers'].indexOf(this.event.request.intent.slots.answer.value.replace(/\W/g, '').toUpperCase());
        let result_text = "";
        if (this.attributes['question'].questions.question[0].answer[answer_index]['$']['score'] == '100') {
            this.attributes['correct_answers']++;
            result_text = "You are right! ";
        } else {
            let i = 0;
            while (this.attributes['question'].questions.question[0].answer[i]['$']['score'] != '100') i++;
            result_text = 'You are not quite right. The correct answer is <emphasis>' + option_letters[i] + '</emphasis> <break time="200ms"/>' + this.attributes['question'].questions.question[0].answer[i]['$']['text'] + '<break time="200ms"/> ';
        }
        result_text += "You have got " + this.attributes['correct_answers'].toString() + " out of " + this.attributes['questions_urls'].length.toString() + " questions right. What would you like to do next?";
        this.attributes['question_index'] = 0;
        this.attributes['correct_answers'] = 0;
        this.emit(':ask', result_text, "What would you like to do next?");
      }
      else if (this.event.request.intent.slots.answer.value) {
        let answer_index = this.attributes['allowed_answers'].indexOf(this.event.request.intent.slots.answer.value.replace(/\W/g, '').toUpperCase());
        if (answer_index > -1) {
          if (this.attributes['question_index'] == this.attributes['questions_urls'].length - 1) {
            this.emit(':delegate');
          } else {
            let result_text = "";
            if (this.attributes['question'].questions.question[0].answer[answer_index]['$']['score'] == '100') {
              this.attributes['correct_answers']++;
              result_text = "You are right! ";
            } else {
              let i = 0;
              while (this.attributes['question'].questions.question[0].answer[i]['$']['score'] != '100') i++;
              result_text = 'You are not quite right. The correct answer is <emphasis>' + option_letters[i] + '</emphasis> <break time="200ms"/>' + this.attributes['question'].questions.question[0].answer[i]['$']['text'] + '<break time="200ms"/> ';
            }

            this.attributes['question_index']++;
            ask_question.call(this, result_text);
          }
        }
        else
          this.emit(':elicitSlot', 'answer', "I didn't get that. Please choose one of the options " + form_valid_options(this.attributes['allowed_answers']), "What do you think?");
      }
      else 
        ask_question.call(this, '');
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


function ask_question(preceding_text) {
  let that = this;
  BooksGetter.get_question(this.attributes['questions_urls'][this.attributes['question_index']], function (question) {
      that.attributes['question'] = question;
      let question_text = preceding_text + form_multiple_choice_question(that.attributes['question_index'], that.attributes['question']);
      that.attributes['allowed_answers'] = option_letters.slice(0, question.questions.question[0].answer.length);
      that.emit(':elicitSlot', 'answer', question_text, "What do you think?");
    });
};


module.exports = QuizHandlers;


function form_multiple_choice_question(index, question) {
  let formed_question = 'Question ' + (index + 1).toString() + '. <break time="100ms"/>' + question.questions.question[0]['$']['text'] + ' <break time="200ms"/> Is it ';
  for (let i = 0; i < question.questions.question[0].answer.length - 1; i++)
    formed_question += '<p>' + '<emphasis>' + option_letters[i] + '</emphasis> <break time="200ms"/>' + question.questions.question[0].answer[i]['$']['text'] + ' </p>';
  formed_question += 'or ';
  let i = question.questions.question[0].answer.length - 1;
  formed_question += '<p>' + '<emphasis>' + option_letters[i] + '</emphasis> <break time="200ms"/>' + question.questions.question[0].answer[i]['$']['text'] + '</p>';
  return formed_question;
}


function form_valid_options(options) {
  return options[0] + ' to ' + options[options.length - 1];
}