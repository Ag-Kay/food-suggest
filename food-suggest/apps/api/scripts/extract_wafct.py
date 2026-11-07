#!/usr/bin/env python3
"""
Extracts per-100 g nutrient values from the FAO/INFOODS WAFCT 2019 Excel file
into prisma/seed/data/wafct.local.json (git-ignored).

Why a local file? WAFCT is licensed for non-commercial use only, so the data is
not committed to the repository. Each developer downloads the official file:
  https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx

Usage (standard library only, no pip installs):
  python3 -I scripts/extract_wafct.py /path/to/WAFCT_2019.xlsx
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
SHEET = 'xl/worksheets/sheet5.xml'  # "05 NV_sum_57 (per 100g EP)"
OUT = Path(__file__).resolve().parent.parent / 'prisma' / 'seed' / 'data' / 'wafct.local.json'

# INFOODS tagname -> our field
TAGS = {
    'PROTCNT': 'proteinG',
    'FAT': 'fatG',
    'CHOAVLDF': 'carbsG',
    'FIBTG': 'fibreG',
    'FASAT': 'saturatedFatG',
    'NA': 'sodiumMg',
    'FE': 'ironMg',
    'CA': 'calciumMg',
}


def parse_value(raw):
    """WAFCT marks lower-quality values with [brackets]; 'tr' means trace."""
    if raw is None:
        return None
    s = str(raw).strip().strip('[]').strip()
    if s == '' or s == '-':
        return None
    if s.lower() == 'tr':
        return 0.0
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def is_low_quality(raw):
    return isinstance(raw, str) and raw.strip().startswith('[')


def main(path):
    z = zipfile.ZipFile(path)
    names = z.namelist()
    if SHEET not in names or 'xl/sharedStrings.xml' not in names:
        sys.exit('This does not look like the WAFCT 2019 workbook.')
    strings = [
        ''.join(t.text or '' for t in si.iter(NS + 't'))
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si')
    ]
    rows = []
    for r in ET.fromstring(z.read(SHEET)).iter(NS + 'row'):
        cells = {}
        for c in r.findall(NS + 'c'):
            v = c.find(NS + 'v')
            val = None if v is None else v.text
            if c.get('t') == 's' and val is not None:
                val = strings[int(val)]
            cells[re.match(r'[A-Z]+', c.get('r')).group(0)] = val
        rows.append(cells)

    tag_row = rows[2]
    columns = {}
    energy_cols = []
    for col, tag in tag_row.items():
        tag = (tag or '').strip()
        if tag == 'ENERC':
            energy_cols.append(col)
        elif tag in TAGS:
            columns.setdefault(TAGS[tag], col)
    if len(energy_cols) < 2:
        sys.exit('Could not find the energy (kcal) column.')
    kcal_col = sorted(energy_cols, key=lambda c: (len(c), c))[1]  # kJ first, then kcal

    foods = {}
    for cells in rows[3:]:
        code = cells.get('A') or ''
        if not re.match(r'^\d\d_\d+$', code):
            continue
        rec = {'name': cells.get('B') or '', 'energyKcal': parse_value(cells.get(kcal_col))}
        low = []
        for field, col in columns.items():
            rec[field] = parse_value(cells.get(col))
            if is_low_quality(cells.get(col)):
                low.append(field)
        rec['lowQualityFields'] = low
        foods[code] = rec

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source': 'wafct-2019', 'foods': foods}, ensure_ascii=False, indent=0))
    print(f'Wrote {len(foods)} foods to {OUT}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
