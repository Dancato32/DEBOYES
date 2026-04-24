import math
from .models import DeliveryZone

# Restaurant Origin: Seth Nii Nartey Street, Accra
RESTAURANT_LAT = 5.6014
RESTAURANT_LNG = -0.1148

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_delivery_fee(lat, lng, area_name):
    """
    DeBoye's Kitchen Delivery Fee Calculator Logic:
    1. PRIORITY: Known Zone Table (Name match)
    2. FALLBACK: GPS Distance Formula from Restaurant
    """
    from django.core.cache import cache
    zones = cache.get('delivery_zones_list')
    if not zones:
        zones = list(DeliveryZone.objects.all())
        cache.set('delivery_zones_list', zones, 3600)

    name_clean = str(area_name).lower().strip()
    
    # 1. KNOWN ZONE TABLE (Direct Name Match)
    for z in zones:
        z_name = z.name.lower()
        if z_name in name_clean or name_clean in z_name:
            dist = z.km if hasattr(z, 'km') else 10.0 # Heuristic if km missing
            return float(z.price), z.name, {
                "distance_km": dist,
                "eta_mins": max(15, round(dist * 5)),
                "method": "table_lookup"
            }

    # 2. GPS DISTANCE FORMULA (Haversine + Multiplier)
    if lat is not None and lng is not None:
        try:
            # Straight-line distance to restaurant
            straight_dist = haversine(float(lat), float(lng), RESTAURANT_LAT, RESTAURANT_LNG)
            
            # Apply road multiplier
            # Default 1.2x, but 1.3x for very far/indirect zones
            multiplier = 1.2
            if straight_dist > 25:
                multiplier = 1.3
            
            adjusted_km = straight_dist * multiplier
            
            # Edge Case: Over 40km (Outside Zone)
            if adjusted_km > 40:
                return 0.0, "OUTSIDE_ZONE"

            # DELIVERY FEE FORMULA:
            # Fee = round(max(15, 8 + distance_km * 1.85) / 5) * 5
            raw_fee = max(15, 8 + adjusted_km * 1.85)
            final_fee = round(raw_fee / 5) * 5
            
            # Ensure minimum fee of 15
            final_fee = max(15, final_fee)
            
            eta = max(15, round(adjusted_km * 5))
            
            return float(final_fee), f"~{round(adjusted_km)}km from Kitchen", {
                "distance_km": round(adjusted_km, 1),
                "eta_mins": eta,
                "method": "haversine"
            }
        except Exception as e:
            print(f"Fee Calculation Error: {e}")

    # FINAL FALLBACK (If no name match and no GPS)
    return 30.0, "General Accra", {
        "distance_km": 15.0,
        "eta_mins": 45,
        "method": "fallback"
    }
