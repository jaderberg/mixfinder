from django.conf.urls.defaults import *
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^test_project/', include('test_project.foo.urls')),
    (r'^$', 'finder.views.index'),
    (r'^finder/', include('finder.urls')),
    ('^admin/', include(admin.site.urls)),
)

handler404 = 'finder.views.index' # overides 404