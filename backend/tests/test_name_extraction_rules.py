import re

ADDRESS_KEYWORDS = [
    "nagar", "road", "street", "marg", "colony", "vihar", "district", "pradesh",
    "enclave", "block", "apartment", "society", "locality", "post", "dist",
    "state", "pincode", "mandal", "taluk", "badvel", "cuddapah", "village",
    "tehsil", "house", "flat", "floor", "plot", "sector", "lane", "cross", "main"
]

HEADER_KEYWORDS = [
    "government", "india", "aadhaar", "digilocker", "address", "s/o", "c/o", "w/o", "d/o",
    "father", "male", "female", "tap to zoom", "proof of", "unique identification", "uidai",
    "help", "issued", "date", "dob", "d0b", "yob", "number", "tax", "income", "department"
]

def extract_clean_name(raw_text: str) -> str:
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

    # Strategy 1: Explicit Label "Name:" or "Applicant Name:" or "Applicant:"
    name_label_match = re.search(r'(?:name|applicant|holder|consumer name)[-:\s#]+([a-zA-Z\s]{3,40})', raw_text, re.IGNORECASE)
    if name_label_match:
        extracted = name_label_match.group(1).strip()
        if not any(ak in extracted.lower() for ak in ADDRESS_KEYWORDS) and not any(hk in extracted.lower() for hk in HEADER_KEYWORDS):
            return extracted.title()

    # Strategy 2: Line directly preceding DOB / Gender on Aadhaar
    for i, l in enumerate(lines):
        lower_l = l.lower()
        if any(k in lower_l for k in ["dob", "d0b", "date of birth", "year of birth", "yob", "male", "female"]) or re.search(r'\d{4}[/-]\d{2}[/-]\d{2}', l):
            # Check line right above
            if i > 0:
                candidate = lines[i-1].strip()
                cand_lower = candidate.lower()
                if not any(hk in cand_lower for hk in HEADER_KEYWORDS) and not any(ak in cand_lower for ak in ADDRESS_KEYWORDS):
                    if re.match(r'^[A-Za-z\s]{3,40}$', candidate) and len(candidate.split()) >= 1:
                        return candidate.title()

    # Strategy 3: First valid non-header non-address line
    for line in lines:
        lower_line = line.lower()
        if any(hk in lower_line for hk in HEADER_KEYWORDS) or any(ak in lower_line for ak in ADDRESS_KEYWORDS):
            continue
        if re.match(r'^[A-Za-z\s]{3,40}$', line) and len(line.split()) >= 1:
            return line.title()

    return None

def test_cases():
    test_text_1 = """
    Government of India
    Aadhaar
    Kondeti Venkata Sai
    2007-06-01
    Male
    XXXXXXXX4093
    Address:
    S/O KONDETI NARAYANA, 6-2-446,
    SUMITHRA NAGAR, BADVEL, Badvel, Badvel,
    Cuddapah, Andhra Pradesh, 516227
    """

    test_text_2 = """
    Government of India
    Aadhaar
    Sumithra Nagar
    Badvel
    Pavani
    DOB: 25/10/2021
    Female
    704025742920
    """

    print("Test 1 Name:", extract_clean_name(test_text_1))
    print("Test 2 Name:", extract_clean_name(test_text_2))

if __name__ == "__main__":
    test_cases()
