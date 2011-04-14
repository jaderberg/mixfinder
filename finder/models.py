from django.db import models

# Create your models here.

class Session(models.Model):
    session_id = models.CharField(max_length=200)
    def __unicode__(self):
        return self.session_id

class SessionData(models.Model):
    session = models.ForeignKey(Session)
    stage = models.IntegerField()
    data = models.TextField()
    def __unicode__(self):
        return str(self.session) + ', stage:' + str(self.stage)






