'use strict';

const constants = require("./constants");
const Alexa = require("alexa-sdk");
const randomInt = require('random-int');
const utilities = require("./utilities");
const BooksGetter = require('./booksGetter');


const CATEGORIES = ["va_animals", "va_family"];

const LEVELS = ["A1", "A2", "B1", "B2"];

const TITLE_ACCEPTABLE_DISTANCE_THRESHOLD = 10;
const CATEGORY_ACCEPTABLE_DISTANCE_THRESHOLD = 2;
const LEVEL_ACCEPTABLE_DISTANCE_THRESHOLD = 0;

const BOOKS_TO_LIST = 5;


const IdleHandlers = Alexa.CreateStateHandler(constants.states.IDLE_MODE, {
  'LaunchRequest': function () {
    	this.emit(':ask', 'Hi! Welcome to LanguaBooks! What would you like to do?', 'What would you like to do?');
	},
	'SessionEndedRequest': function () {
      console.log("session ended intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
	},
  'AMAZON.StopIntent': function() {
      console.log("amazon.StopIntent intent fired");
      this.emit(':tell', "Thank you for checking out LanguaBooks. Have a nice day!");
  },
  'AMAZON.HelpIntent': function() {
    let help_text = `<p> You can ask Languabooks to list books available to you like this: what books do you have? Or you can specify a category, for example: what books about family do you have? </p>
      <p> You can set a level from which to list books or pick a random book. Say set level, then specify level </p>
      <p> To pick a book say find and book title. Then say play </p>
      <p> You can also ask Languabooks to pick a book for you like this: pick any book. Then you can specify a category or say any </p>
      <p> You can say stop to leave the languabooks skill </p>`;
    this.emit(':ask', help_text, 'What would you like to do?');
  },
	'list_books': function () {
      console.log("list_books intent fired");
      let categories_to_search = CATEGORIES;
      let category_text = "";
      let level_text = "";
      if (this.attributes['level'] != "")
        level_text = " with level " + this.attributes['level'];
      let category = this.event.request.intent.slots.category_name.value;
      if (category) {
        let found_category = utilities.findNearestMatch("va_" + category, CATEGORIES, CATEGORY_ACCEPTABLE_DISTANCE_THRESHOLD);
        if (found_category != "") {
          categories_to_search = [found_category];
          category_text = " about " + found_category.replace("va_", "");
        }
        else
          this.emit(':ask', "Sorry. I don't have books from the category " + category + ". Please try something else", 'What would you like to hear?');
      }
      let that = this;
      BooksGetter.get_available_books(this.attributes['api_token'], categories_to_search, this.attributes['level'], function (data) {
        let booksMap = data;
        let books = Object.keys(booksMap);
        if (books.length > 0) {
          let richResponse = "I have the following books" + category_text + level_text + ": ";          
          if (books.length > BOOKS_TO_LIST)
            books = books.slice(0, BOOKS_TO_LIST);
          for (book of books) {
            richResponse += book + ", ";
          }
          richResponse = richResponse.slice(0, richResponse.length-2) + '. Say find and title to get the book you want';
          that.emit(':ask', richResponse, 'Say find and title to get the book you want');
        }
        else
         that.emit(':ask', "Sorry. I did not find anything. Please try something else", 'What would you like to hear?'); 
      });
	},
  'set_level': function () {
      console.log("set_level intent fired");
      if (this.event.request.dialogState != "COMPLETED") {
          this.emit(':delegate');
      } else {
        let level = this.event.request.intent.slots.level_name.value.replace("one", "1").replace("two", "2").replace(/ /g, '');
        console.log(level);
        let found_level = utilities.findNearestMatch(level, LEVELS.concat(["any"]), LEVEL_ACCEPTABLE_DISTANCE_THRESHOLD);
        if (found_level != "") {
            if (found_level == "any")
              this.attributes['level'] = "";
            else 
              this.attributes['level'] = found_level;
            this.emit(':ask', "Level " + found_level + " was set. What would you like to do?", 'What would you like to do?');
        }
        else
            this.emit(':ask', "Sorry. Level " + level + " is not valid. Please pick one of the levels A1, A2, B1, B2 or say any", 'What would you like to do?');
      }
  },
  'pick_random_book': function () {
      console.log("pick_random_book intent fired");
      if (this.event.request.dialogState != "COMPLETED") {
          this.emit(':delegate');
      } else {
          let categories_to_search = [];
          let category_text = "";
          let category = this.event.request.intent.slots.category_name.value;
          let found_category = utilities.findNearestMatch("va_" + category, CATEGORIES.concat(["va_any"]), CATEGORY_ACCEPTABLE_DISTANCE_THRESHOLD);
          if (found_category != "") {
            if (found_category == "va_any") {
              categories_to_search = CATEGORIES;
            } else {
              categories_to_search = [found_category];
              category_text = "about " + found_category.replace("va_", "");
            }
          }
          else
            this.emit(':ask', "Sorry. I don't have books from the category " + category + ". Please try something else", 'What would you like to hear?');
          let that = this;
          BooksGetter.get_available_books(this.attributes['api_token'], categories_to_search, this.attributes['level'], function (data) {
            let booksMap = data;
            let count = Object.keys(booksMap).length;
            if (count > 0){
              let found_title = Object.keys(booksMap)[randomInt(count-1)];
              that.attributes['picked_book_title'] = found_title;
              that.attributes['picked_book_id'] = booksMap[found_title];
              that.handler.state = constants.states.FOUND_BOOK_MODE;
              that.emit(':ask', 'I picked for you the book ' + category_text + ' <break time="200ms"/>' + found_title + '<break time="100ms"/>. Say play to play the book',
                'Say play to play the book');
            }
            else
             that.emit(':ask', "Sorry. I did not find anything. Please try something else", 'What would you like to hear?'); 
          });
      }
  },
  'find_book': function () {
      console.log("find_book intent fired " + this.event.request.intent.slots.title.value);
      let title = this.event.request.intent.slots.title.value;
      let that = this;
      BooksGetter.get_available_books(this.attributes['api_token'], CATEGORIES, '', function (data) {
        let booksMap = data;
        let found_title = utilities.findNearestMatch(title, Object.keys(booksMap), TITLE_ACCEPTABLE_DISTANCE_THRESHOLD);
        if (found_title != "") {
          that.attributes['picked_book_title'] = found_title;
          that.attributes['picked_book_id'] = booksMap[found_title];
          that.handler.state = constants.states.FOUND_BOOK_MODE;
          that.emit(':ask', 'I found the book <break time="200ms"/>' + found_title + '<break time="100ms"/>. Say play to play the book',
            'Say play to play the book');
        }
        else
          that.emit(':ask', "Sorry, I could not find this title. Try again please.", "What do you want to hear?");
      });
  },
  'play_found_book': function () {
      console.log("play_found_book without book intent fired");
      this.emit(':ask', "Sorry. You haven't picked a book", "What do you want to hear?")
  },
	'Unhandled': function() {
        console.log("unhandled intent fired");
        console.log(this.event.request.type);
        if (this.event.request.type === 'System.ExceptionEncountered') {
          console.log(this.event.request.error.type);
          console.log(this.event.request.error.message);
        }
        this.emit(':ask', "Sorry. I don't understand", "What would you like to do?");
  }
});


module.exports = IdleHandlers;