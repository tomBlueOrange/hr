#!/usr/bin/env python3
"""Generate realistic dummy load data for the FDE interview app.

Keeps the original hand-authored loads (LD-100001..LD-100012) intact and
appends procedurally generated loads until the file contains at least 1000.

The generator keeps fields internally consistent the same way the hand
authored data is:
  - miles is the (approx) great-circle distance between the two cities
  - loadboardRate is derived from miles via an equipment-specific per-mile
    rate plus a little noise
  - delivery datetime = pickup datetime + driving time implied by the miles
  - commodity, weight, dimensions and notes are drawn from pools that match
    the equipment type

Availability over time: pickup dates are spread evenly (round-robin) across a
window running from WINDOW_START through WINDOW_END so that EVERY day in the
window has a guaranteed minimum number of loads. The window extends well past
a 2-week run so that, no matter which day the API is called, there are always
loads whose pickupDateTime is still in the future.

Deterministic: uses a fixed RNG seed so re-running produces the same file.

Usage:  python3 scripts/generate_loads.py [TOTAL]   (default TOTAL=1000)
"""

import json
import math
import os
import random
import sys
from datetime import datetime, timedelta, timezone

SEED = 20260531
TARGET_TOTAL = int(sys.argv[1]) if len(sys.argv) > 1 else 1000

# Pickup-date window. Today is 2026-05-31; loads start picking up tomorrow and
# run through mid-July. That is ~6.5 weeks of coverage, so even at the end of a
# 2-week run there are still weeks of future-dated loads available. Pickup days
# are assigned round-robin across this window so every day gets an even share.
WINDOW_START = datetime(2026, 6, 1, tzinfo=timezone.utc)
WINDOW_END = datetime(2026, 7, 15, tzinfo=timezone.utc)

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(
    HERE, "..", "src", "main", "resources", "data", "dummy_load_data.json"
)

# (city label, latitude, longitude) — major US freight markets.
CITIES = [
    ("Chicago, IL", 41.8781, -87.6298),
    ("Dallas, TX", 32.7767, -96.7970),
    ("Los Angeles, CA", 34.0522, -118.2437),
    ("Phoenix, AZ", 33.4484, -112.0740),
    ("Atlanta, GA", 33.7490, -84.3880),
    ("Miami, FL", 25.7617, -80.1918),
    ("Houston, TX", 29.7604, -95.3698),
    ("Denver, CO", 39.7392, -104.9903),
    ("Seattle, WA", 47.6062, -122.3321),
    ("Portland, OR", 45.5152, -122.6784),
    ("Newark, NJ", 40.7357, -74.1724),
    ("Boston, MA", 42.3601, -71.0589),
    ("Memphis, TN", 35.1495, -90.0490),
    ("Kansas City, MO", 39.0997, -94.5786),
    ("Salt Lake City, UT", 40.7608, -111.8910),
    ("Las Vegas, NV", 36.1699, -115.1398),
    ("Minneapolis, MN", 44.9778, -93.2650),
    ("Charlotte, NC", 35.2271, -80.8431),
    ("Nashville, TN", 36.1627, -86.7816),
    ("Detroit, MI", 42.3314, -83.0458),
    ("Indianapolis, IN", 39.7684, -86.1581),
    ("Oakland, CA", 37.8044, -122.2712),
    ("Reno, NV", 39.5296, -119.8138),
    ("Columbus, OH", 39.9612, -82.9988),
    ("Cleveland, OH", 41.4993, -81.6944),
    ("St. Louis, MO", 38.6270, -90.1994),
    ("Cincinnati, OH", 39.1031, -84.5120),
    ("Louisville, KY", 38.2527, -85.7585),
    ("Oklahoma City, OK", 35.4676, -97.5164),
    ("San Antonio, TX", 29.4241, -98.4936),
    ("El Paso, TX", 31.7619, -106.4850),
    ("Albuquerque, NM", 35.0844, -106.6504),
    ("Sacramento, CA", 38.5816, -121.4944),
    ("Fresno, CA", 36.7378, -119.7871),
    ("Stockton, CA", 37.9577, -121.2908),
    ("San Diego, CA", 32.7157, -117.1611),
    ("Jacksonville, FL", 30.3322, -81.6557),
    ("Orlando, FL", 28.5383, -81.3792),
    ("Tampa, FL", 27.9506, -82.4572),
    ("Savannah, GA", 32.0809, -81.0912),
    ("Charleston, SC", 32.7765, -79.9311),
    ("Raleigh, NC", 35.7796, -78.6382),
    ("Richmond, VA", 37.5407, -77.4360),
    ("Baltimore, MD", 39.2904, -76.6122),
    ("Harrisburg, PA", 40.2732, -76.8867),
    ("Pittsburgh, PA", 40.4406, -79.9959),
    ("Buffalo, NY", 42.8864, -78.8784),
    ("Milwaukee, WI", 43.0389, -87.9065),
    ("Des Moines, IA", 41.5868, -93.6250),
    ("Omaha, NE", 41.2565, -95.9345),
    ("Tulsa, OK", 36.1540, -95.9928),
    ("Little Rock, AR", 34.7465, -92.2896),
    ("New Orleans, LA", 29.9511, -90.0715),
    ("Birmingham, AL", 33.5186, -86.8104),
    ("Laredo, TX", 27.5306, -99.4803),
    ("Fort Worth, TX", 32.7555, -97.3308),
    ("Boise, ID", 43.6150, -116.2023),
    ("Spokane, WA", 47.6588, -117.4260),
    ("Tucson, AZ", 32.2226, -110.9747),
    ("Wichita, KS", 37.6872, -97.3301),
]

# Equipment-specific generation profiles.
EQUIPMENT = {
    "Dry Van": {
        "weight": (8000, 44000),
        "rate_per_mile": (1.70, 2.65),
        "min_rate": 600,
        "pieces": (12, 650),
        "dims": [(96, 102, 636)],
        "commodities": [
            ["Packaged Foods", "Canned Goods"],
            ["Consumer Electronics"],
            ["Apparel", "Footwear"],
            ["Auto Parts"],
            ["Furniture"],
            ["Bottled Beverages", "Packaged Foods"],
            ["Paper Products"],
            ["Household Goods"],
            ["Plastics", "Packaging Materials"],
            ["Pet Food"],
            ["Toys", "Sporting Goods"],
            ["Office Supplies"],
            ["Hardware", "Tools"],
            ["Books", "Printed Materials"],
            ["Cosmetics", "Personal Care"],
        ],
        "notes": [
            "No-touch freight. Driver assist not required. Appointment required at delivery.",
            "Drop and hook available. FCFS at pickup, appointment at delivery.",
            "Palletized freight. Driver counts pieces. Detention paid after 2 hours.",
            "High value freight, sealed trailer required. Team not necessary.",
            "Light load, partial trailer. Liftgate not required. Dock high delivery.",
            "Live load and live unload. Lumper fee reimbursed with receipt.",
            "Appointment required both ends. No driver assist. Dock high.",
            "Stackable freight, floor loaded. Driver count at pickup.",
        ],
    },
    "Reefer": {
        "weight": (20000, 44000),
        "rate_per_mile": (2.10, 3.20),
        "min_rate": 650,
        "pieces": (16, 30),
        "dims": [(96, 99, 636)],
        "commodities": [
            ["Fresh Produce", "Lettuce"],
            ["Frozen Seafood"],
            ["Dairy", "Refrigerated Goods"],
            ["Frozen Foods"],
            ["Meat", "Poultry"],
            ["Ice Cream"],
            ["Pharmaceuticals", "Temperature Controlled"],
            ["Fresh Flowers"],
            ["Berries", "Fresh Produce"],
            ["Cheese", "Dairy"],
            ["Beverages", "Refrigerated Goods"],
        ],
        "notes": [
            "Temperature controlled at 34F. Continuous reefer. Produce load.",
            "Frozen. Set to -10F. Lumper fee reimbursed with receipt.",
            "Reefer set to 36F. Multi-stop, two delivery appointments.",
            "Continuous reefer at 38F. Download temp records at delivery.",
            "Frozen load at 0F. Pre-cool trailer before pickup.",
            "Temp set to 34F. Appointment required. Lumper at delivery.",
            "Protect from freeze. Reefer on cycle at 40F.",
        ],
    },
    "Flatbed": {
        "weight": (25000, 48000),
        "rate_per_mile": (2.30, 3.40),
        "min_rate": 700,
        "pieces": (1, 16),
        "dims": [(100, 102, 636), (102, 102, 636), (110, 102, 636)],
        "commodities": [
            ["Steel Pipe", "Building Materials"],
            ["Industrial Machinery"],
            ["Steel Coil"],
            ["Lumber", "Building Materials"],
            ["Concrete Pipe"],
            ["Structural Steel"],
            ["Roofing Materials"],
            ["Aluminum Sheet"],
            ["Tractor", "Heavy Equipment"],
            ["Pallets of Brick"],
            ["Drywall", "Building Materials"],
            ["Rebar"],
        ],
        "notes": [
            "Tarps and straps required. Oversize permit not needed. Loaded with forklift.",
            "Step deck preferred. Machinery secured with chains. Dunnage provided.",
            "Coil load, coil racks required. Tarping needed. Loaded center of trailer.",
            "Tarps required. 4 straps minimum. Loaded by overhead crane.",
            "Chains and binders required. Secure per regulations.",
            "Open deck. Tarping not required. Forklift load and unload.",
            "Heavy haul, max legal weight. Distribute load evenly.",
        ],
    },
}
EQUIPMENT_WEIGHTS = [0.55, 0.27, 0.18]  # Dry Van / Reefer / Flatbed mix


def haversine_miles(a, b):
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))


def round_rate(value):
    # Round to the nearest $5 like the hand-authored data, keep .00 cents.
    return float(round(value / 5.0) * 5)


def generate(rng, load_id, pickup_day):
    origin, dest = rng.sample(CITIES, 2)
    straight = haversine_miles((origin[1], origin[2]), (dest[1], dest[2]))
    # Road miles run longer than straight-line; add ~18% plus jitter.
    miles = round(straight * rng.uniform(1.12, 1.24))
    miles = max(60, miles)

    equipment = rng.choices(list(EQUIPMENT), weights=EQUIPMENT_WEIGHTS)[0]
    profile = EQUIPMENT[equipment]

    rpm = rng.uniform(*profile["rate_per_mile"])
    # Short hauls pay a higher effective per-mile rate.
    if miles < 300:
        rpm *= rng.uniform(1.15, 1.45)
    rate = max(profile["min_rate"], miles * rpm)
    rate = round_rate(rate)

    weight = float(rng.randint(profile["weight"][0] // 100, profile["weight"][1] // 100) * 100)
    pieces = rng.randint(*profile["pieces"])
    h, w, length = rng.choice(profile["dims"])
    commodity = list(rng.choice(profile["commodities"]))
    notes = rng.choice(profile["notes"])

    # Pickup on the day assigned by the caller, at a sensible hour; delivery
    # follows from the driving time implied by the miles.
    pickup = pickup_day.replace(
        hour=rng.randint(5, 14),
        minute=rng.choice([0, 15, 30, 45]),
        second=0,
        microsecond=0,
    )
    # ~50 mph average plus a few hours of dwell/break time.
    transit_hours = miles / 50.0 + rng.uniform(2, 6)
    delivery = pickup + timedelta(hours=transit_hours)
    delivery = delivery.replace(minute=rng.choice([0, 15, 30, 45]), second=0, microsecond=0)

    def iso(dt):
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "loadId": load_id,
        "startingLocation": origin[0],
        "deliveryLocation": dest[0],
        "pickupDateTime": iso(pickup),
        "deliveryDateTime": iso(delivery),
        "equipmentType": equipment,
        "loadboardRate": rate,
        "notes": notes,
        "weight": weight,
        "commodityType": commodity,
        "numOfPieces": pieces,
        "miles": float(miles),
        "dimensions": {"height": h, "width": w, "length": length},
    }


def main():
    rng = random.Random(SEED)

    with open(os.path.normpath(DATA_FILE)) as f:
        loads = json.load(f)

    existing_ids = {l["loadId"] for l in loads}
    # Continue numbering after the highest existing LD-1000xx id.
    max_num = max(int(l["loadId"].split("-")[1]) for l in loads)

    # One pickup date per day across the window, assigned round-robin so the
    # generated loads are spread evenly — every day gets the same share +/- 1.
    num_days = (WINDOW_END - WINDOW_START).days + 1
    days = [WINDOW_START + timedelta(days=i) for i in range(num_days)]

    next_num = max_num + 1
    generated = 0
    while len(loads) < TARGET_TOTAL:
        load_id = f"LD-{next_num:06d}"
        next_num += 1
        if load_id in existing_ids:
            continue
        pickup_day = days[generated % num_days]
        loads.append(generate(rng, load_id, pickup_day))
        existing_ids.add(load_id)
        generated += 1

    with open(os.path.normpath(DATA_FILE), "w") as f:
        json.dump(loads, f, indent=2)
        f.write("\n")

    print(f"Wrote {len(loads)} loads to {os.path.normpath(DATA_FILE)}")


if __name__ == "__main__":
    main()
