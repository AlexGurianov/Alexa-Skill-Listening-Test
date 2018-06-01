const request_pack = require('request');
const md5 = require('md5');
const parseXMLStringToJson = require('xml2js').parseString;


const API_URL = 'https://devapi.languametrics.com:8443/api-v4/';


methods = {
	get_access_token : function(google_id, callback) {
		request_pack({  
    	url: '/login?',
    	baseUrl: API_URL,
    	method: 'GET',
    	qs: {login: 'google' + google_id, password: md5(google_id + 'asdlkgfjasfbsndfbsl;dfkgajsfkga')}
    }, function (error, response, body) {
				let data = JSON.parse(body);
				callback(data["token"]);
			});
	},
	get_available_books : function(token_value, categories_list, level, callback) {
		params = {"cohortidnumber": categories_list};
		if (level != "")
			params['p_CEFR'] = level;
		request_pack({  
	    	url: '/courses/search',
	    	baseUrl: API_URL,
	    	method: 'POST',
				form: {
						token: token_value, 
	    	 		searchcriterias: JSON.stringify(params)
				}
	    }, function (error, response, body) {
						let books_list = JSON.parse(body);
						let available_books = {};
						for (book of books_list) {
							if (book.enrol == '1') {
								let name = book.name;
								let idx = name.indexOf('(');
								if (idx > -1)
									name = name.substring(0, idx);
								name = name.trim();
								available_books[name] = book.id;
							}
						}
						callback(available_books);
				});
	},
	read_book_contents : function(token_value, course_id_number, callback){
		request_pack({  
    	url: '/activity/list?',
    	baseUrl: API_URL,
    	method: 'GET',
    	qs: {token: token_value, courseidnumber: course_id_number}
    }, function (error, response, body) {
				let book_info = JSON.parse(body);
				let reading_types = ["SRS", "SAS", "FCR", "FCA"];
				let quiz_types = ["LRA", "LAA"];
				let pages_urls = [];
				let questions_urls = [];
				for (page of book_info.scos) {
					if (reading_types.indexOf(page.type) > -1) {
						let contentkey = JSON.parse(page.params)["title_id"];
							pages_urls.push("https://s3.amazonaws.com/speech-content-devel/Library/" + contentkey + "/" + contentkey + "_Audio.mp3");
					}
					if (quiz_types.indexOf(page.type) > -1) {
						let contentkey = JSON.parse(page.params)["title_id"];
						questions_urls.push("https://s3.amazonaws.com/speech-content-devel/Library/" + contentkey + "/" + contentkey + "_Questions.xml");
					}
				}
				callback(pages_urls, questions_urls);
			});
	},
	get_question : function(url, callback) {
		request_pack({  
    	url: url,
    	method: 'GET'
	    }, function (error, response, body) {
					parseXMLStringToJson(body, function (err, result) {
    					callback(result);
					});
		});
	}
}


module.exports = methods;