from gts_hub.utils.rest import GTSModelSerializer
from rest_framework import serializers
from django.utils.translation import ugettext as _

from gts_hub.gts_auth.models import User, Group, UserGroup, MenuAccess
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from rest_framework import serializers
from gts_hub.gts_auth.encrypt import Encrypt


class UserSerializer(GTSModelSerializer):
    #zone = serializers.CharField(required=True)

    class Meta:
        model = User
        exclude = ("usr_password",)

class ChangePasswordSerializer(GTSModelSerializer):
    #zone = serializers.CharField(required=True)

    class Meta:
        model = User
        exclude = ("usr_password","groups","usr_description")

class GroupSerializer(GTSModelSerializer):
    functions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Group





class MenuAccessSerializer(GTSModelSerializer):

    class Meta:
        model = MenuAccess
