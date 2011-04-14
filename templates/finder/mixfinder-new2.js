// mixfinder. Copyright Max Jadererg 2011

var innerText = $('<p>find mixes</p>').hide();

var mixfinder = {
    host: 'http://mixfinder.sites.djangohosting.ch/finder/',
    session_id: '',
    go: function() {
        // show the first box
        mixfinder.showStageOne(function() {
            // get a session token
            $.getJSON(mixfinder.host + 'start-session/?callback=?', function(response) {
                mixfinder.session_id = response.session_id; //save session id
                // grab inputs and start finding mixes
                q = mixfinder.inputsToJSON();   //encode to json
                // set url
                setURLParameter(q.trackList);
                // set to JSON
                q = $.toJSON(q);
                // now start the entire process
                $.getJSON(mixfinder.host + 'find-mixes/' + mixfinder.session_id + '/?q=' + q + '&callback=?', function(response) {
                    // this occurs only when all 3 stages are complete
                    // note: end session only after you are done polling
                });
                // start polling stage 1
                mixfinder.pollStage(1)
            });
        });
    },
    pollStage: function(stage) {
        $.getJSON(mixfinder.host + 'stage-data/' + mixfinder.session_id + '/?stage=' + stage + '&callback=?', function(response) {
            // check if stage one is complete or not
            if (response.response == 'not complete') {
                // keep polling until complete
                setTimeout('mixfinder.pollStage(' + response.stage + ');', 1000);
            } else if (response.response == 'stage complete') {
                if (response.stage == '1') {
                    //mixes arrived
                    mixfinder.completeStageOne(response.data, function() {
                        mixfinder.showStageTwo(function() {
                            mixfinder.pollStage(2);
                        });
                    });
                } else if (response.stage == '2') {
                    //songs arrived
                    mixfinder.completeStageTwo(response.data, function() {
                        mixfinder.showStageThree(function() {
                            mixfinder.pollStage(3);
                        });
                    });
                } else if (response.stage == '3') {
                    //mixes arrived
                    mixfinder.completeStageThree(response.data);
                    mixfinder.endSession();
                }
            }
        });
    },
    endSession: function() {
        $.getJSON(mixfinder.host + 'end-session/' + mixfinder.session_id + '/?callback=?', function() {
            // FINISHED
        });
    },
    inputsToJSON: function() {
        var songInputs = $('.song');
        var q = {};
        q.trackList = [];
        for (n = 0; n < songInputs.length; n++) {
            if ($(songInputs[n]).val() != 'song name' && $(songInputs[n]).next().val() != 'artist') {
                q.trackList.push($(songInputs[n]).val() + ' - ' + $(songInputs[n]).next().val());
            }
        }
        return q;
    },
    showStageOne: function(cbfunc) {
        innerText.fadeOut(function() {
            $('.find-button').animate({ width: 'toggle' }, function() {
                innerText.hide();
                $(this).attr('class', 'connector');
                $(this).animate({ width: 'toggle' }, function() {
                    $('#first-box').animate({ width: 'toggle' }, function() {
                        $('#first-box h1').slideDown();
                        $('#first-box .loading-image').slideDown(function() {
                            cbfunc();   // callback function
                        });
                    });
                });
            });
        });
    },
    completeStageOne: function(data, cbfunc) {
        var mixes = data.mixes;
        if (data.shownext == 0) {
            $('#first-box .loading-image').slideToggle(function() {
                $('#first-loading').hide();
                $('<h2><a href="index.html">no results</a></h2>').appendTo($('#first-box')).hide().slideDown();
                mixfinder.endSession(); //no results, stop everything
            });
        } else {
            $('#first-box .loading-image').slideToggle(function() {
                $('#first-loading').hide();
                for (n = 0; n < data.shownext; n++) {
                    try {
                        $('#first-box .mix-holder').append('<div class="container">' + mixes[n] + '</div>').hide().slideDown();
                    } catch (loljk) {
                        //nothing
                    }
                }
                if (mixes.length > data.shownext) {
                    $('#first-box .more-button').slideDown();
                    $('#first-box .more-button').click(function() {
                        var holder = $('<div class="mix-holder"></div>');
                        $('<div class="container" style="display:block-inline;">' + mixes[data.shownext] + '</div>').appendTo(holder);
                        data.shownext++;
                        if (data.shownext < mixes.length) {
                            //no more to add
                            $('<div class="container" style="display:block-inline;">' + mixes[data.shownext] + '</div>').appendTo(holder);
                            data.shownext++;
                        }
                        holder.hide();
                        holder.insertBefore($(this)).slideDown();
                        if (data.shownext == mixes.length) {
                            //no more to add
                            $(this).slideUp();
                        }
                    });
                }
                cbfunc(); // callback function
            });
        }
    },
    showStageTwo: function(cbfunc) {
        $('#arrow-down').slideDown(function() {
            $('#second-box h1').show();
            $('#second-box .loading-image').show();
            $('#second-box').slideDown(function() {
                cbfunc();   //callback
            });
        });
    },
    completeStageTwo: function(data, cbfunc) {
        var suggestions = data.songs;
        if (data.shownext == 0) {
            $('#second-box .loading-image').slideToggle(function() {
                $('#second-loading').hide();
                $('<h2><a href="index.html">no results</a></h2>').appendTo($('#second-box')).hide().slideDown();
                mixfinder.endSession();
            });
        } else {
            $('#second-box .loading-image').slideToggle(function() {
                $('#second-loading').hide();
                for (n = 0; n < data.shownext; n++) {
                    $('#second-box .song-holder').append('<div class="song-suggestion" >' + suggestions[n] + '</div>').hide().slideDown();
                }
                if (suggestions.length > data.shownext) {
                    $('#second-box .more-button').slideDown();
                    $('#second-box .more-button').click(function() {
                        var holder = $('#second-box .song-holder');
                        $('<div class="song-suggestion" >' + suggestions[data.shownext] + '</div>').appendTo(holder).hide().slideDown();
                        data.shownext++;
                        if (data.shownext == suggestions.length) {
                            $(this).slideUp();
                        }
                    });
                }
                cbfunc();
            });
        }
    },
    showStageThree: function(cbfunc) {
        $('#arrow-left').animate({ width: 'toggle' }, function() {
            $('#third-box h1').show();
            $('#third-box .loading-image').show();
            $('#third-box').slideDown(function() {
                cbfunc();
            });
        });
    },
    completeStageThree: function(data) {
        var mixes = data.mixes;
        if (data.shownext == 0) {
            $('#third-box .loading-image').slideToggle(function() {
                $('#third-loading').hide();
                $('<h2><a href="index.html">no results</a></h2>').appendTo($('#third-box')).hide().slideDown();
            });
        } else {
            $('#third-box .loading-image').slideToggle(function() {
                $('#third-loading').hide();
                for (n = 0; n < data.shownext; n++) {
                    $('#third-box .mix-holder').append('<div class="container">' + mixes[n] + '</div>').hide().slideDown();
                }
                if (mixes.length > data.shownext) {
                    $('#third-box .more-button').slideDown();
                    $('#third-box .more-button').click(function() {
                        var holder = $('<div class="mix-holder"></div>');
                        $('<div class="container" style="display:block-inline;">' + mixes[data.shownext] + '</div>').appendTo(holder);
                        data.shownext++;
                        if (data.shownext < mixes.length) {
                            //no more to add
                            $('<div class="container" style="display:block-inline;">' + mixes[data.shownext] + '</div>').appendTo(holder);
                            data.shownext++;
                        }
                        holder.hide();
                        holder.insertBefore($(this)).slideDown();
                        if (data.shownext == mixes.length) {
                            //no more to add
                            $(this).slideUp();
                        }
                    });
                }
            });
        }
    }
}



//-----------Input box-----------//
//slide out button
function showFindButton() {
    if ($('.find-button').css('width') != '96px') {
        $('.find-button').animate({ width: '96px' }, function() {
            innerText.fadeIn();
        });
    }
}
//hide button
function hideFindButton() {
    if ($('.find-button').css('width') == '96px') {
        innerText.fadeOut(function() {
            $('.find-button').animate({ width: '0px' });
        });
    }
}
//check input boxes have valid input
function checkForValidInputs() {
    var songInputs = $('.song');
    var valid = false;
    for (n = 0; n < songInputs.length; n++) {
        if ($(songInputs[n]).val() != 'song name' && $(songInputs[n]).next().val() != 'artist') {
            if ($(songInputs[n]).val() != '' && $(songInputs[n]).next().val() != '') {
                //text in both
                valid = true;
            }
        }
    }
    return valid;
}
// handlers for the inputs
function inputHandlers() {
    $('input').focus(function() {
        $(this).val('');
        $(this).css('color', '#efefef');
        $(this).css('text-shadow', '#4998A3 1px 1px 1px');
    });
    $('input').blur(function() {
        $(this).val($(this).attr('init'));
        $(this).css('color', '#7ec0c0');
        $(this).css('text-shadow', '');
    });
    $('input').keyup(function() {
        if ($(this).val()) {
            $(this).unbind('focus');
            $(this).unbind('blur');
            if (checkForValidInputs()) {
                showFindButton();
            }
        } else {
            if (checkForValidInputs()) {
                showFindButton();
            } else {
                hideFindButton();
            }
        }
    });
}


$(document).ready(function() {
    inputHandlers();
    $('#more-input').click(function() {
        //slide in a new input
        var newinput = $('<div class="song-input"><input init="song name" class="song" value="song name" spellcheck="false" />by<input init="artist" value="artist" class="artist" spellcheck="false"/></div>').hide();
        newinput.appendTo($('.input-holder')).slideDown();
        inputHandlers();    //refresh inputs
    });
    $('.content-box').hide();
    $('.content-box').children().hide();
    $('#arrow-down').hide(); $('#arrow-left').hide();
    innerText.appendTo('.find-button');
    $('#input-box').animate({ width: 'toggle' }, function() {
        $('#input-box').children().slideDown();
    });
    $('.find-button').click(function() {
        mixfinder.go();
    });
    setInputBoxes();
});


function setInputBoxes() {
   
    trackList = getURLParameter('q');
    if (trackList != 'null') {
        // preset inputs
        rows = trackList.split('|');
        for (var n = 0; n < rows.length; n++) {
            var songInputs = $('.song');
            var song = rows[n].split('~')[0];
            var artist = rows[n].split('~')[1];
            $(songInputs[n]).val(song);
            $(songInputs[n]).next().val(artist);
            $(songInputs[n]).css('color', '#efefef');
            $(songInputs[n]).css('text-shadow', '#4998A3 1px 1px 1px');
            $(songInputs[n]).next().css('color', '#efefef');
            $(songInputs[n]).next().css('text-shadow', '#4998A3 1px 1px 1px');
        }
        setTimeout('showFindButton();', 1000);
    }
}

function setURLParameter(trackList) {
    var qstring = '';
    for (var n = 0; n < trackList.length; n++) {
        qstring = qstring + trackList[n].split(' - ')[0] + '~' + trackList[n].split(' - ')[1] + '|';
    }
    qstring = '#?q=' + escape(qstring.substring(0, qstring.length - 1));
    window.location.href = window.location.href.substring(0, window.location.href.lastIndexOf('?') - 1) + qstring;
}

function getURLParameter(name) {
    return unescape(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.hash) || [, null])[1]
    );
}