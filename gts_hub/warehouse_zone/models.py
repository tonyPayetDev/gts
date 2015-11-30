import gts_models

class WarehouseZone(gts_models.WarehouseZone):
    class Meta:
        proxy = True
        managed = False
