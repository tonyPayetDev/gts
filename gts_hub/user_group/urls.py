from django.conf.urls import include

from django.conf.urls import patterns, url

from django.views.generic.base import TemplateView
from django.contrib.auth.decorators import login_required, permission_required

urlpatterns = patterns('gts_hub.user_group.views',
    url(r'^user$', login_required(permission_required('GTS_REF_STATUS', None, True)(
        TemplateView.as_view(template_name="user.html"))),
        name="users"),
    url(r'^group$', login_required(permission_required('GTS_REF_STATUS', None, True)(
        TemplateView.as_view(template_name="group.html"))),
        name="groups"),
)





#Partie API de l'appli
from gts_hub.user_group.rest_api import UserViewSet , GroupViewSet , MenuAccessViewSet , ChangePasswordViewSet
from rest_framework import routers
router = routers.SimpleRouter()
router.register('user', UserViewSet)
router.register('group', GroupViewSet)
router.register('function', MenuAccessViewSet)
router.register('changePassword', ChangePasswordViewSet)


ref_user_api_urls = [
    url(r'^', include(router.urls))
]
