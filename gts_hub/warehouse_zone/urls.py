"""all urls of warehouse_preparation

"""

from django.conf.urls import patterns, url, include

from rest_framework.routers import SimpleRouter

from gts_hub.warehouse_zone.views import warehouseZone



# Partie API de l'appli
from gts_hub.warehouse_zone.rest_api import WarehouseZoneViewSet
from rest_framework import routers
router = routers.SimpleRouter()
router.register('Warehouse', WarehouseZoneViewSet)

warehouse_zone_api_urls = [
    url(r'^', include(router.urls))
]


urlpatterns = patterns('gts_hub.warehouse_zone.views',
    url(r'^$', warehouseZone, name="warehouse_zone"),
)
