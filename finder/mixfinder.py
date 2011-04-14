import urllib2
import json

baseURL = 'http://api.mixcloud.com' # api base url

#trackList = ['before i move off - mount kimbie', 'cmyk - james blake']

# for each track in trackList, find the cloudcasts which contain it
def getMixesFromTracksSearch(trackList):
    cloudcasts = []
    for trackName in trackList:
        url = baseURL + '/search/?q=' + trackName.replace(' ', '+') + '&type=track'
        try:
        	data = json.loads(urllib2.urlopen(url).read())
        except:
            data = {'data': []}
        # take first track as desired one
        tracks = data['data']
        if tracks:
            firstTrack = tracks[0]
            trackKey = firstTrack['key']
            # get popular mixes with track
            url = baseURL + trackKey + 'popular/?limit=100'
            try:
            	data = json.loads(urllib2.urlopen(url).read())
            except:
            	data = {'data': []}
            cloudcasts.extend(data['data']) # add the found mixes to the list
    return cloudcasts

# removes duplicates from a list
def __removeDuplicates(seq):
    # order preserving
    checked = []
    for e in seq:
        if e not in checked:
            checked.append(e)
    return checked

# creates a list of all unique tracks with how often they occur in a list
# of mixes
def getTracksInMixes(mixes):
    tracks = {}
    for mix in mixes:
        # get the mix object
        url = baseURL + mix['key']
        try:
        	data = json.loads(urllib2.urlopen(url).read())
        except:
            data = {}
        else:
            for section in data['sections']:
                try:
                    trackKey = section['track']['key']
                    # add a count to the track
                    try:
                        tracks[trackKey] += 1
                    except:
                        tracks[trackKey] = 1
                except:
                    pass
    import operator
    return sorted(tracks.iteritems(), key=operator.itemgetter(1), reverse=True)

# excludes mixes already served up from search tracks
def getMixesFromTrackKeys(trackKeys, mixesFromSearch, trackList):
    searchedTracks = trackKeys[0:(len(trackList)-1)]
    trackKeys = trackKeys[len(trackList):(len(trackList)+9)]
    mixesFromCorrellated = []
    for trackKey in trackKeys:
        #get popular mixes
        url = baseURL + trackKey[0] + 'popular/?limit=100'
        try:
            data = json.loads(urllib2.urlopen(url).read())
        except:
            data = {'data': []}
        mixesFromCorrellated.extend(data['data'])   # add the popular mixes
    desiredMixes = []
    for mix in mixesFromCorrellated:
        if mixesFromSearch.count(mix):
            # contains a mix which was already served
            pass
        else:
            desiredMixes.append(mix)
    return desiredMixes

# weight mixes depending on how often they occur in list
def countFreqOfMixes(mixList):
    mixesWithFreq = []
    checked = []
    for mix in mixList:
        if mix not in checked:
            tup = mix, mixList.count(mix)
            mixesWithFreq.append(tup)
            checked.append(mix)
    return mixesWithFreq

def getTrackFromKey(trackKey):
    url = baseURL + trackKey
    try:
    	data = json.loads(urllib2.urlopen(url).read())
    except:
    	return {}
    else:
        return data

def getEmbedCode(mixKey):
    url = baseURL + mixKey + 'embed-json/'
    try:
    	data = json.loads(urllib2.urlopen(url).read())
    except:
    	return {'html':''}
    else:
        return data

################################################################################

def stage_one(trackList):
    # stage one - get mixes containing tracks #
    mixes = getMixesFromTracksSearch(trackList) # includes duplicates
    return mixes

def stage_two(mixes):
    return getTracksInMixes(mixes)

def stage_three(corrTracks, mixes, trackList):
    mixesFromCorrellated = getMixesFromTrackKeys(corrTracks, mixes, trackList)
    return countFreqOfMixes(mixesFromCorrellated)

# get all mixes containing the tracks
##mixes = getMixesFromTracksSearch(trackList) # includes duplicates
####mixesWithFreq = countFreqOfMixes(mixes)
####for mix in mixesWithFreq:
####    if mix[1] > 1:
####        print mix[0]['key'] + ' count: ' + str(mix[1])
####print len(mixes)
####print len(__removeDuplicates(mixes))
### from these mixes list all songs and order by frequency in list of mixes
##correllatedTracks = getTracksInMixes(mixes)
### get mixes containing correlated tracks
##mixesFromCorrellated = getMixesFromTrackKeys(correllatedTracks, mixes)
##print len(mixesFromCorrellated)
##mixesWithFreq = countFreqOfMixes(mixesFromCorrellated)
##print len(mixesWithFreq)
##for mix in mixesWithFreq:
##    if mix[1] > 1:
##        print mix[0]['key'] + ' count: ' + str(mix[1])