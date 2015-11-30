from gts_hub.warehouse_zone.serializers import WarehouseZoneSerializer
from gts_hub.warehouse_zone.models import WarehouseZone
from gts_hub.utils.rest import GTSModelViewSet
from rest_framework.permissions import IsAuthenticated

class WarehouseZoneViewSet(GTSModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = WarehouseZoneSerializer
    queryset = WarehouseZone.objects.all()
