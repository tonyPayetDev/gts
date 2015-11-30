from gts_hub.utils.rest import GTSModelSerializer
from rest_framework import serializers
from django.utils.translation import ugettext as _

from gts_hub.warehouse_zone.models import WarehouseZone
from gts_hub.gts_modal_dlg.models import Iata

class WarehouseZoneSerializer(GTSModelSerializer):
    zone = serializers.CharField(required=True)

    class Meta:
        model = WarehouseZone
        fields = ('zone', 'description','stop')


    def validate_stop(self, attrs, source):
        value = attrs.get(source)

        if not value: # empty value is allowed
            return attrs

        # verifie si le iata existe bien sinon renvoie une erreur     
        try:

            Iata.objects.get(code=value)

        except Iata.DoesNotExist:
            raise serializers.ValidationError(_('iata does not exist '))

        return attrs
