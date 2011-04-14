// mixfinder. Copyright Max Jaderberg 2011
var innerText = $('<p>find mixes</p>').hide();

var mixEmbedCode = '<div><object width="200" height="200"><param name="movie" value="http://www.mixcloud.com/media/swf/player/mixcloudLoader.swf?v=106"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><param name="flashVars" value="feed=http://www.mixcloud.com/api/1/cloudcast/djsonica/party-filth-mix.json&embed_uuid=220772d0-ceb1-4f4f-b6d5-3586649a3dcd&embed_type=widget_standard"></param><embed src="http://www.mixcloud.com/media/swf/player/mixcloudLoader.swf?v=106" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" flashvars="feed=http://www.mixcloud.com/api/1/cloudcast/djsonica/party-filth-mix.json&embed_uuid=220772d0-ceb1-4f4f-b6d5-3586649a3dcd&embed_type=widget_standard" width="200" height="200"></embed></object><div style="clear:both; height:3px;"></div><p style="display:block; font-size:12px; font-family:Helvetica, Arial, sans-serif; margin:0; padding: 3px 4px 3px 4px; color:#999;"><a href="http://www.mixcloud.com/djsonica/party-filth-mix/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=cloudcast_link" style="color:#02a0c7; font-weight:bold;">Party Filth Mix</a> by <a href="http://www.mixcloud.com/djsonica/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=profile_link" style="color:#02a0c7; font-weight:bold;">Djsonica</a> on <a href="http://www.mixcloud.com/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=homepage_link" style="color:#02a0c7; font-weight:bold;"> Mixcloud</a></p><div style="clear:both; height:3px;"></div></div>'
var mixes1 = { shownext: 2, mixes: [mixEmbedCode, mixEmbedCode, mixEmbedCode, mixEmbedCode, mixEmbedCode] };
var mixes2 = {shownext:2, mixes:[mixEmbedCode, mixEmbedCode, mixEmbedCode, mixEmbedCode, mixEmbedCode, mixEmbedCode]};
var songs = {shownext:3, songs:['Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake', 'Limit to your love by James Blake']};

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
        mixfinder();
    });
});

var session = {};
var host = 'http://mixfinder.sites.djangohosting.ch/finder/';

//--------Sequence Handler-------//
function mixfinder() {
    // show the first box
    showFirstBox(function() { 
        // get a session token
        $.getJSON(host + 'start-session/?callback=?', function(response) {
            session.session_id = response.session_id; //save session id
            // grab inputs and start finding mixes
            q = $.toJSON(inputsToJSON());   //encode to json
            // now start the entire process
            $.getJSON(host + 'find-mixes/' + session.session_id + '/?q=' + q + '&callback=?', function(response) {
                // this occurs only when all 3 stages are complete
                // note: end session only after you are done polling
            });
            // start polling stage 1
            pollStage(1)
        });
    });  
}

// polls a stage
function pollStage(stage) {
    $.getJSON(host + 'stage-data/' + session.session_id + '/?stage=' + stage + '&callback=?', function(response) {
        // check if stage one is complete or not
        if (response.response == 'not complete') {
            // keep polling until complete
            setTimeout('pollStage(' + response.stage + ');', 1000);
        } else if (response.response == 'stage complete') {
            if (response.stage == '1') {
                //mixes arrived
                mixesArrived(response.data, function() {
                    showSecondBox(function() {
                        pollStage(2);
                    });
                });
            } else if (response.stage == '2') {
                //songs arrived
                songSuggestionsArrived(response.data, function() {
                    showThirdBox(function() { 
                        pollStage(3);
                    });
                });
            } else if (response.stage == '3') {
                //mixes arrived
                mixSuggestionsArrived(response.data);
                endSession();
            }
        }
    });
}

function endSession() {
    $.getJSON(host + 'end-session/' + session.session_id + '/?callback=?', function() {
        // FINISHED
    });
}

// converts inputs to JSON to be sent to mixfinder
function inputsToJSON() {
    var songInputs = $('.song');
    var q = {};
    q.trackList = [];
    for (n = 0; n < songInputs.length; n++) {
        if ($(songInputs[n]).val() != 'song name' && $(songInputs[n]).next().val() != 'artist') {
            q.trackList.push($(songInputs[n]).val() + ' - ' + $(songInputs[n]).next().val());
        }
    }
    return q;
}

//---------Third Stage-----------//
function showThirdBox(cbfunc) {
    $('#arrow-left').animate({ width: 'toggle' }, function() {
        $('#third-box h1').show();
        $('#third-box .loading-image').show();
        $('#third-box').slideDown(function() {
            cbfunc();
        });
    });
}

function mixSuggestionsArrived(data) {
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


//--------Second Stage-----------//
function showSecondBox(cbfunc) {
    $('#arrow-down').slideDown(function() {
        $('#second-box h1').show();
        $('#second-box .loading-image').show();
        $('#second-box').slideDown(function() {
            cbfunc();   //callback
        });
    });
}

function songSuggestionsArrived(data, cbfunc) {
    var suggestions = data.songs;
    if (data.shownext == 0) {
        $('#second-box .loading-image').slideToggle(function() {
            $('#second-loading').hide();
            $('<h2><a href="index.html">no results</a></h2>').appendTo($('#second-box')).hide().slideDown();
            endSession();
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
}

//---------First Stage-----------//
function showFirstBox(cbfunc) {
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
}

function mixesArrived(data, cbfunc) {
    var mixes = data.mixes;
    if (data.shownext == 0) {
        $('#first-box .loading-image').slideToggle(function() {
            $('#first-loading').hide();
            $('<h2><a href="index.html">no results</a></h2>').appendTo($('#first-box')).hide().slideDown();
            endSession(); //no results, stop everything
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