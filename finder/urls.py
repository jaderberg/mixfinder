from django.conf.urls.defaults import *

urlpatterns = patterns('finder.views',
    (r'^$', 'info'),
    (r'^start-session/$', 'startSession'),
    (r'^find-mixes/(?P<session_id>.+)/$', 'findMixes'),
    (r'^stage-data/(?P<session_id>.+)/$', 'get_stage_data'),
    (r'^end-session/(?P<session_id>.+)/$', 'endSession')
)
