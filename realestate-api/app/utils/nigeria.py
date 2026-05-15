# Nigerian local context constants for the real estate platform

# ── Currency ──────────────────────────────────────────────────────────────────
CURRENCY_SYMBOL = "₦"
CURRENCY_CODE = "NGN"
CURRENCY_NAME = "Nigerian Naira"

# ── Nigerian States ───────────────────────────────────────────────────────────
NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
    "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

# ── Popular Cities / Areas per State ─────────────────────────────────────────
POPULAR_CITIES = {
    "Lagos": ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Ajah",
              "Ikorodu", "Badagry", "Epe", "Alimosho", "Oshodi", "Mushin",
              "Ibeju-Lekki", "Maryland", "Gbagada", "Magodo", "Ojota"],
    "FCT - Abuja": ["Wuse", "Garki", "Maitama", "Asokoro", "Gwarinpa", "Kubwa",
              "Lugbe", "Kuje", "Bwari", "Gwagwalada", "Nyanya", "Dutse"],
    "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Okrika", "Bonny"],
    "Kano": ["Kano Municipal", "Fagge", "Dala", "Nasarawa", "Gwale"],
    "Oyo": ["Ibadan", "Ogbomoso", "Oyo", "Iseyin", "Saki"],
    "Delta": ["Warri", "Asaba", "Uvwie", "Sapele", "Ughelli"],
    "Enugu": ["Enugu", "Nsukka", "Agbani", "Oji River"],
    "Anambra": ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
}

# ── Amenities common in Nigerian properties ───────────────────────────────────
COMMON_AMENITIES = [
    "PHCN/NEPA Electricity",
    "Prepaid Meter",
    "Borehole Water",
    "Running Water (Mains)",
    "Generating Set (Generator)",
    "Inverter / Solar",
    "DSTV / Cable TV Point",
    "Tiled Floors",
    "POP Ceiling",
    "Wardrobe / Fitted Closet",
    "Air Conditioning",
    "Security / Gateman",
    "CCTV Camera",
    "Electric Fence",
    "Perimeter Wall",
    "Parking Space",
    "Boys Quarter (BQ)",
    "Swimming Pool",
    "Gym",
    "Elevator / Lift",
    "Serviced (facilities managed)",
    "Furnished",
    "Semi-Furnished",
    "Internet / WiFi Ready",
    "Tarred / Paved Road",
    "Drainage System",
    "Estate / Gated Community",
]

# ── Property types Nigerian context ──────────────────────────────────────────
PROPERTY_TYPES = {
    "house":        "Detached / Semi-detached House",
    "apartment":    "Flat / Apartment",
    "room":         "Self-Contain / Room & Parlour",
    "land":         "Land / Plot",
    "commercial":   "Commercial / Office Space",
    "shortlet":     "Short-let / Service Apartment",
    "warehouse":    "Warehouse / Storage",
}

# ── Listing types ─────────────────────────────────────────────────────────────
LISTING_TYPES = {
    "rent":     "For Rent",
    "sale":     "For Sale (Outright)",
    "lease":    "Long Lease",
    "shortlet": "Short-let (per night / weekly)",
}

# ── Price periods ─────────────────────────────────────────────────────────────
PRICE_PERIODS = {
    "monthly":   "Per Month",
    "yearly":    "Per Year (Annual Rent)",
    "once":      "Outright / One-time",
    "per_night": "Per Night",
}

# ── Typical Nigerian rent advance notice ─────────────────────────────────────
RENT_ADVANCE_OPTIONS = [1, 2, 6, 12, 24]   # months

# ── Document types requested in Nigeria ──────────────────────────────────────
TITLE_DOCUMENTS = [
    "Certificate of Occupancy (C of O)",
    "Governor's Consent",
    "Deed of Assignment",
    "Survey Plan",
    "Registered Survey",
    "Building Plan Approval",
    "Deed of Conveyance",
    "Gazette",
    "Right of Occupancy (R of O)",
    "Receipt + Agreement",
]
