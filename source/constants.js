"use strict";

module.exports = Object.freeze({
    
    appId : "amzn1.ask.skill.e48739dc-4c00-49d8-8267-01a10681b292",
    
    dynamoDBTableName : 'LanguaBooksTable',
    
    states : {
        START_MODE : '',
        IDLE_MODE : '_IDLE_MODE',
        FOUND_BOOK_MODE: '_FOUND_BOOK_MODE',
        READING_MODE: '_READING_MODE',
        QUIZ_MODE: '_QUIZ_MODE'
    }
});