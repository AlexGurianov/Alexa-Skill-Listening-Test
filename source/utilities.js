String.prototype.levenstein = function(string) {
    var a = this, b = string + "", m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 0; i <= b.length; m[i] = [i++]);
    for (j = 0; j <= a.length; m[0][j] = j++);

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1, 
                    min(m[i][j - 1] + 1, m[i - 1 ][j] + 1));
        }
    }

    return m[b.length][a.length];
	};

methods = {
	findNearestMatch : function (title, titles_list, threshold) {
	  let found_title = "";
	  title = title.toUpperCase();
		let index = titles_list.map((x)=>x.toUpperCase()).indexOf(title);
		if (index > -1) {
			found_title = titles_list[index];
		}
		else {
			let distances = titles_list.map((x)=>x.toUpperCase().levenstein(title));
			let min = distances[0];
			let min_index = 0;
			for (let i = 1; i < distances.length; i ++){
				if (distances[i] < min){
					min = distances[i];
					min_index = i;
				}
			}
			if (min <= threshold)
				found_title = titles_list[min_index];
		}
		return found_title;
	},
	ssml : (template, ...inputs) => {
	  // Generate the raw escaped string
	  const raw = template.reduce((out, str, i) => i
	    ? out + (
	      inputs[i - 1]
	        .replace(/&/g, '&amp;')
	        .replace(/</g, '&lt;')
	        .replace(/>/g, '&gt;')
	        .replace(/"/g, '&quot;')
	    ) + str
	    : str
	  );
	  // Trim out new lines at the start and end but keep indentation
	  const trimmed = raw
	    .replace(/^\s*\n(\s*)<speak>/, '$1<speak>')
	    .replace(/<\/speak>\s+$/, '</speak>');
	  // Remove extra indentation
	  const lines = trimmed.split('\n');
	  const indent = /^\s*/.exec(lines[0])[0];
	  const match = new RegExp(`^${indent}`);
	  return lines.map(line => line.replace(match, '')).join('\n');
	},
	audio_controller : {
    startFromBeginning: function () {
        console.log("startFromBeginning fired");
        this.attributes['playbackFinished'] = false;
        this.attributes['index'] = 0;
        this.attributes['offsetInMilliseconds'] = 0;
        this.response.speak('Playing the book. When done, say <emphasis>Alexa, next</emphasis> to go to quiz. <break time="100ms"/>' + this.attributes['picked_book_title']);
        this.emitWithState('AMAZON.ResumeIntent');
    },
    play: function () {
        console.log("play fired");
        if (!this.attributes['playbackFinished']) {
          this.attributes['enqueuedToken'] = null;
          const behavior = 'REPLACE_ALL';
          const url = this.attributes['pages_urls'][this.attributes['index']];
          const token = this.attributes['pages_urls'][this.attributes['index']];
          const offsetInMilliseconds = this.attributes['offsetInMilliseconds'];
          this.response.audioPlayerPlay(behavior, url, token, null, offsetInMilliseconds);
        }
        else {
          this.response.speak('You have finished listening to the book. Say restart to start over.').listen('What would you like to do?');
        }
        this.emit(':responseReady');
    },
    stop: function () {
        this.response.audioPlayerStop();
        this.emit(':responseReady');
    }
 }
}


module.exports = methods;