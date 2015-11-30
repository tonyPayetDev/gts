from gts_hub.user_group.serializers import UserSerializer, GroupSerializer, MenuAccessSerializer , ChangePasswordSerializer
from gts_hub.gts_auth.models import User, Group, UserGroup, MenuAccess 
from gts_hub.utils.rest import GTSModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from gts_hub.gts_auth.encrypt import Encrypt
from rest_framework import serializers
from rest_framework.serializers import ValidationError 
from django.db import IntegrityError
from gts_hub.gts_auth.encrypt import Encrypt
from django.utils import timezone
import datetime


class ChangePasswordViewSet(GTSModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer
    queryset = User.objects.all()
    #todo partial update for usr password exclusif
    def update(self, context, **kwargs):
        user = User.objects.get(usr_userid=kwargs.get('pk'))

        if User.check_password(user,context.DATA['passwordold'])==False:
            return Response( {'passwordolderror': ['ne correspond pas a  votre mot de passe.']},status=400)  
        else:
            context.DATA.pop('passwordold')   

        if context.DATA['usr_password']:
            user.usr_password = Encrypt.encrypt(
                context.DATA['usr_password'])
            context.DATA.pop('usr_password')


        serializer = ChangePasswordSerializer(user, data=context.DATA)

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class UserViewSet(GTSModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def update(self, context, **kwargs):
        user = User.objects.get(usr_userid=kwargs.get('pk'))

        usr_password=context.DATA.pop('usr_password',None)

        if usr_password :
            user.usr_password = Encrypt.encrypt(usr_password)
        
        a = UserGroup.objects.filter(aug_userid=user)
        a.delete()
        serializer = UserSerializer(user, data=context.DATA)

        if serializer.is_valid():
            serializer.save()
            user = User.objects.get(usr_userid=context.DATA.get('usr_userid'))

            for g in context.DATA.get('groups'):
                group = Group.objects.get(grp_groupname=g)
                UserGroup.objects.get_or_create(
                    aug_userid=user, aug_groupname=group)

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def create(self, context, **kwargs):


        password=context.DATA.pop('usr_password')

        context.DATA['usr_first_login']= datetime.datetime.now()
        

        serializer = UserSerializer(data=context.DATA)

        if serializer.is_valid():
            serializer.save()
            user = User.objects.get(usr_userid=context.DATA.get('usr_userid'))

            if password:
                user.usr_password = Encrypt.encrypt(password)
                user.save()

            for g in context.DATA.get('groups'):
                group = Group.objects.get(grp_groupname=g)
                UserGroup.objects.get_or_create(
                    aug_userid=user, aug_groupname=group)

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class GroupViewSet(GTSModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = GroupSerializer
    queryset = Group.objects.all()

    def update(self, context, **kwargs):
        # import pdb; pdb.set_trace()
        if not context.DATA.get('grp_groupname'): # if user input nothing 
            return Response( {'grp_groupname': ['mandatory']},status=400)
        # search user if exist and create user if remplace 
        old_group_name = context.DATA.get('oldgroups', None)
        if context.DATA.get('grp_groupname')!=old_group_name:
            try:
                Group.objects.get(grp_groupname=context.DATA.get('grp_groupname'))
                return Response( {'grp_groupname': ['exists']},status=400)
            except Group.DoesNotExist:
                try:
                  # try something
                    group = Group.objects.get(grp_groupname=old_group_name)
                    group.delete()
                    group.grp_groupname = context.DATA.get('grp_groupname')
                    group.save()
                except IntegrityError:
                    return Response( {'grp_groupname': ['exists']},status=400)
        else:
            group=Group.objects.get(grp_groupname=old_group_name)      
        MenuAccess.objects.filter(groupname_id=group.grp_groupname).delete()
        for f in context.DATA.get('functions'):
            MenuAccess.objects.create(groupname_id=group.grp_groupname, appid=1, functionid=f)
        return Response(context.DATA, status=201)

    # def oldupdate(self, context, **kwargs):
    #     if not context.DATA.get('grp_groupname'): # if user input nothing 
    #         return Response( {'grp_groupname': ['This field is mandatory.']},status=400)
    #     # search user if exist and create user if remplace 
    #     if context.DATA.get('grp_groupname')!=context.DATA.get('oldgroups'):
    #         try:
    #             group = Group.objects.create(grp_groupname=context.DATA.get('grp_groupname'))
    #             Group.objects.get(grp_groupname=context.DATA.get('oldgroups')).delete()
    #         except IntegrityError:
    #             return Response( {'grp_groupname': ['existe deja.']},status=400)
    #     else:
    #         group=Group.objects.get(grp_groupname=context.DATA.get('grp_groupname'))      
    #         supprMenuAccess = MenuAccess.objects.filter(groupname_id=context.DATA.get('grp_groupname'))
    #         supprMenuAccess.delete()
    #     context.DATA.pop('oldgroups')   
    #     serializers = GroupSerializer(group,data=context.DATA)
    #     if serializers.is_valid():
    #         serializers.save()
    #         for f in context.DATA.get('functions'):
    #             MenuAccess.objects.create(groupname_id=context.DATA.get(
    #                 'grp_groupname'), appid=1, functionid=f)
    #         return Response(serializers.data, status=201)
    #     return Response(serializers.errors, status=400)



    def create(self, context, **kwargs):


        serializers = GroupSerializer(data=context.DATA)

        if serializers.is_valid():
            serializers.save()
        
            for f in context.DATA.get('functions'):

                MenuAccess.objects.create(groupname_id=context.DATA.get(
                    'grp_groupname'), appid=1, functionid=f)

            return Response(serializers.data, status=201)
        print(serializers.errors)    
        return Response(serializers.errors, status=400)


class MenuAccessViewSet(GTSModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = MenuAccessSerializer
    queryset = MenuAccess.objects.all()
