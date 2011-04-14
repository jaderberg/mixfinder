from django.http import HttpResponse, HttpResponseRedirect
from finder.models import *
import json
import uuid
import mixfinder
from django.core.servers.basehttp import FileWrapper
from django.shortcuts import render_to_response

def index(request):
    return render_to_response('finder/index.html')

def info(request):
    return render_to_response('finder/mixfinder.html')

def startSession(request):
    s = Session()
    new_uuid = str(uuid.uuid4())
    while (Session.objects.filter(session_id=new_uuid)):
        new_uuid = str(uuid.uuid4())
    s.session_id = new_uuid
    s.save()
    response_data = {}
    response_data['result'] = 'success'
    response_data['session_id'] = s.session_id
    return __jsonResponse(request, response_data)

def endSession(request, session_id):
    try:
        s = Session.objects.get(session_id=session_id)
        s.delete()
        return __jsonResponse(request, {'result':'success'})
    except:
        return __jsonResponse(request, {'result':'fail'})

def __jsonResponse(request, response_data):
    try:
        func = request.GET.get('callback')
        return HttpResponse(func + '(' + json.dumps(response_data) + ')', mimetype="application/javascript")
    except:
        return HttpResponse(json.dumps(response_data), mimetype="application/json")


def findMixes(request, session_id):
    #finder/find-mixes/1232-21312-232/?q={"trackList":["sdasd","asdasd"]}
    response_data = {}
    response_data['session_id'] = session_id
    try:
        # get session
        s = Session.objects.get(session_id=session_id)
        # decode url
        if not len(request.GET):
            response_data['result'] = 'fail'
            response_data['response'] = 'need a list of songs (?q={"trackList":["song - one", "song - two"]}'
        else:
            try:
                response_data['result'] = 'success'
                songs = json.loads(request.GET.get('q'))['trackList']
                response_data['tracks'] = songs
            except:
                 response_data['result'] = 'fail'
                 response_data['response'] = 'need a list of songs (?q={"trackList":["song - one", "song - two"]}'
    except:
        response_data['result'] = 'fail'
        response_data['response'] = 'no session exists with that id'

    if response_data['result'] == 'success':
        # start the process
        __run_mixfinder(s, response_data['tracks'])
        response_data['response'] = 'complete'
    return __jsonResponse(request, response_data)

def get_stage_data(request, session_id):
    response_data = {}
    response_data['session_id'] = session_id
    try:
        # get session
        s = Session.objects.get(session_id=session_id)
        # get which stage needs returning
        try:
            stage = int(request.GET.get('stage'))
            response_data['stage'] = stage
            if s.sessiondata_set.filter(stage=stage).count():
                # stage one has finished so return the data
                response_data['result'] = 'success'
                response_data['response'] = 'stage complete'
                response_data['data'] = json.loads(s.sessiondata_set.get(stage=stage).data)
            else:
                # stage one has not completed yet
                response_data['result'] = 'success'
                response_data['response'] = 'not complete'
        except:
            response_data['result'] = 'fail'
            response_data['response'] = 'select a stage (e.g. /?stage=1)'
    except:
        response_data['result'] = 'fail'
        response_data['response'] = 'no session exists with that id'

    return __jsonResponse(request, response_data)



def __run_mixfinder(session, trackList):
    session.sessiondata_set.all().delete()  # delete any previous data
    #####################################
    # stage one
    mixes = mixfinder.stage_one(trackList)
    mixesWithFreq = sorted(mixfinder.countFreqOfMixes(mixes), key=lambda mix: mix[1], reverse=True)
    stageone_data = {}
    stageone_data['mixes'] = []
    for mix in mixesWithFreq:
        if mix[1] > 1:
            stageone_data['mixes'].append(mixfinder.getEmbedCode(mix[0]['key'])['html'].replace('"300"', '"200"'))
    if len(mixesWithFreq) and not stageone_data['mixes']:
        for mix in mixesWithFreq[0:4]:
            stageone_data['mixes'].append(mixfinder.getEmbedCode(mix[0]['key'])['html'].replace('"300"', '"200"'))
    if len(stageone_data['mixes']) > 2:
        stageone_data['shownext'] = 2
    else:
        stageone_data['shownext'] = len(stageone_data['mixes'])
    # save the data
    session.sessiondata_set.create(stage=1, data=json.dumps(stageone_data))
    #######################################
    # stage two
    correllatedTracks = sorted(mixfinder.stage_two(mixes), key=lambda track: track[1], reverse=True)
    stagetwo_data = {}
    stagetwo_data['songs'] = []
    for track in correllatedTracks[len(trackList):(len(trackList)+9)]:
        if track[1] > 1:
            # want to return the name not the key
            trackobject = mixfinder.getTrackFromKey(track[0])
            track = (trackobject['name'] + ' by ' + trackobject['artist']['name'])
            stagetwo_data['songs'].append(track)
    if len(stagetwo_data['songs']) > 3:
        stagetwo_data['shownext'] = 3
    else:
        stagetwo_data['shownext'] = len(stagetwo_data['songs'])
    # save the data
    session.sessiondata_set.create(stage=2, data=json.dumps(stagetwo_data))
    ########################################
    # stage three
    newMixesWithFreq = sorted(mixfinder.stage_three(correllatedTracks,mixes, trackList), key=lambda mix: mix[1], reverse=True)
    stagethree_data = {}
    stagethree_data['mixes'] = []
    for mix in newMixesWithFreq:
        if mix[1] > 1:
            stagethree_data['mixes'].append(mixfinder.getEmbedCode(mix[0]['key'])['html'].replace('"300"', '"200"'))
    if len(newMixesWithFreq) and not stagethree_data['mixes']:
        for mix in newMixesWithFreq[0:4]:
            stagethree_data['mixes'].append(mixfinder.getEmbedCode(mix[0]['key'])['html'].replace('"300"', '"200"'))
    if len(stagethree_data['mixes']) > 2:
        stagethree_data['shownext'] = 2
    else:
        stagethree_data['shownext'] = len(stagethree_data['mixes'])
    # save the data
    session.sessiondata_set.create(stage=3, data=json.dumps(stagethree_data))