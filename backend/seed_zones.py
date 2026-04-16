import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from orders.models import DeliveryZone

zones = [
    # 15 GH
    ("Teshie", 15, 5.5836, -0.1008),
    ("Bush Road", 15, 5.5800, -0.1100),
    
    # 20 GH
    ("Nungua", 20, 5.6019, -0.0753),
    ("Tse Addo", 20, 5.5900, -0.1300),
    ("Labadi Beach", 20, 5.5600, -0.1500),
    ("Mahama Road", 20, 5.5700, -0.1500),
    
    # 25 GH
    ("Laboma", 25, 5.5600, -0.1600),
    ("Manet", 25, 5.6100, -0.1400),
    ("Junction Mall", 25, 5.6010, -0.0760),
    
    # 30 GH
    ("Sakumono", 30, 5.6200, -0.0400),
    ("Osu", 30, 5.5500, -0.1800),
    ("Cantoments", 30, 5.5800, -0.1700),
    ("Spintex", 30, 5.6300, -0.1000),
    ("Airport", 30, 5.6000, -0.1700),
    
    # 35 GH
    ("Lashibi", 35, 5.6500, -0.0400),
    ("Stadium", 35, 5.5500, -0.1900),
    
    # 40 GH
    ("Ministries", 40, 5.5420, -0.1950),
    ("Makola", 40, 5.5450, -0.2100),
    ("Jamestown", 40, 5.5350, -0.2110),
    ("Circle", 40, 5.5600, -0.2100),
    ("Adabraka", 40, 5.5600, -0.2000),
    ("East Legon", 40, 5.6330, -0.1510),
    ("UPSA", 40, 5.6530, -0.1710),
    ("UG", 40, 5.6510, -0.1870),
    ("Madina", 40, 5.6700, -0.1700),
    ("Accra Mall", 40, 5.6170, -0.1710),
    ("Tema", 40, 5.6660, -0.0160),
    ("Ashiaman", 40, 5.6940, -0.0240),
    
    # 50 GH
    ("Adenta", 50, 5.7000, -0.1600),
    ("Korle Bu", 50, 5.5400, -0.2300),
    ("Dansoman", 50, 5.5500, -0.2700),
    ("Mamprobi", 50, 5.5400, -0.2500),
    ("Achimota", 50, 5.6200, -0.2300),
    ("Mile 7", 50, 5.6250, -0.2450),
    ("Lapaz", 50, 5.6020, -0.2430),
    ("Haatso", 50, 5.6800, -0.2100),
    ("Westland", 50, 5.6550, -0.2150),
    ("North Legon", 50, 5.6850, -0.1950),
    ("Nana Krom", 50, 5.6800, -0.1200),
    ("Kaneshie", 50, 5.5700, -0.2300),
    ("Odorkor", 50, 5.5800, -0.2600),
    
    # 60 GH
    ("Dome", 60, 5.6500, -0.2300),
    ("Kwabenya", 60, 5.6800, -0.2400),
    ("Weija", 60, 5.5500, -0.3400),
    ("Mallam", 60, 5.5700, -0.2900),
    ("Afrieya", 60, 5.7200, -0.2000),
    ("Pokuase", 60, 5.6980, -0.2820),
    ("Oyarifa", 60, 5.7480, -0.1740),
    
    # 70 GH
    ("Kasoa", 70, 5.5300, -0.4200),
    ("Amasaman", 70, 5.7000, -0.3000),
    ("Oyibi", 70, 5.7900, -0.1300),
]

def seed():
    print(f"Seeding {len(zones)} zones...")
    created_count = 0
    for name, price, lat, lng in zones:
        zone, created = DeliveryZone.objects.get_or_create(
            name=name,
            defaults={'price': price, 'lat': lat, 'lng': lng}
        )
        if created:
            created_count += 1
    print(f"Done! Created {created_count} new zones.")

if __name__ == '__main__':
    seed()
