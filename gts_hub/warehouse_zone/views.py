from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import render

from gts_hub.warehouse_preparation.forms import IndicationForm


# Create your views here.

@login_required
@permission_required('GTS_REF_WAREHOUSE_ZONE', None, True)
def warehouseZone(request):
    form = IndicationForm()
    return render(request, 'warehouse_zone.html', locals())
