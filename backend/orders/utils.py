import math
from .models import DeliveryZone

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # radius of earth in kilometers
    R = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_delivery_fee(lat, lng, area_name):
    """
    Smart fee calculation:
    1. Try exact name match from user's list.
    2. Fallback to nearest neighbor coordinate estimation.
    """
    zones = list(DeliveryZone.objects.all())
    if not zones:
        # Emergency fallback if database is empty
        return 20.0, "Default"

    # Step 1: Direct Name Match
    # We check if the area name provided by the customer contains or is contained in our zone list
    name_clean = str(area_name).lower().strip()
    
    best_match = None
    for z in zones:
        z_name = z.name.lower()
        if z_name in name_clean or name_clean in z_name:
            # We prioritize direct name matches
            return float(z.price), z.name

    # Step 2: Proximity Estimate using GPS
    # If we couldn't match the name, we find the closest anchor point
    if lat is not None and lng is not None:
        try:
            # Sort by distance
            zones_with_distance = [
                (z, haversine(float(lat), float(lng), z.lat, z.lng)) 
                for z in zones
            ]
            nearest_zone, dist = min(zones_with_distance, key=lambda x: x[1])
            
            # If the distance is reasonable (e.g. within same metro area), use neighbor price
            return float(nearest_zone.price), f"Estimated (via {nearest_zone.name})"
        except Exception as e:
            print(f"Distance calculation error: {e}")

    # Final Catch-all Fallback (e.g. if GPS is missing)
    return 30.0, "General Accra"
