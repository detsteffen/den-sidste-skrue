#!/usr/bin/env python3
"""Draws the Aarhus area map and writes it to src/drawings/map.svg.

The shapes come from tools/aarhus-map.json: municipality borders with the
real coastline, lakes, the motorway and place positions, reduced from
OpenStreetMap data (© OpenStreetMap contributors, ODbL). The towns listed
here are the ones the postcode check on the page answers yes to.

Run it after changing a town or a label:

    python3 tools/draw_map.py
"""

from collections.abc import Sequence
import json
import math
import pathlib

_TOOLS = pathlib.Path(__file__).parent
_OUT = _TOOLS.parent / 'src/drawings/map.svg'
_PX_PER_DEGREE = 2000
_KM_PER_DEGREE = 111.32

# Name, postcode, position (a place name in the data, or longitude and
# latitude) and the side of the dot the label sits on.
_TOWNS = [
    ('Aarhus C', 8000, (10.2050, 56.1530), 't'),
    ('Aarhus N', 8200, (10.1950, 56.1900), 'l'),
    ('Aarhus V', 8210, 'Hasle', 'l'),
    ('Brabrand', 8220, 'Brabrand', 'l'),
    ('Åbyhøj', 8230, 'Åbyhøj', 'b'),
    ('Risskov', 8240, 'Risskov', 'l'),
    ('Egå', 8250, 'Egå', 'l'),
    ('Viby', 8260, 'Viby J.', 'l'),
    ('Højbjerg', 8270, 'Højbjerg', 'l'),
    ('Tranbjerg', 8310, 'Tranbjerg', 'l'),
    ('Mårslet', 8320, 'Mårslet', 'l'),
    ('Beder', 8330, (10.2110, 56.0600), 'l'),
    ('Malling', 8340, (10.1960, 56.0370), 'l'),
    ('Solbjerg', 8355, 'Solbjerg', 'r'),
    ('Hasselager', 8361, 'Hasselager', 'l'),
    ('Trige', 8380, 'Trige', 'r'),
    ('Tilst', 8381, 'Tilst', 'l'),
    ('Harlev', 8462, 'Harlev', 'r'),
    ('Sabro', 8471, 'Sabro', 'r'),
    ('Lystrup', 8520, 'Lystrup', 'l'),
    ('Hjortshøj', 8530, 'Hjortshøj', 'l'),
    ('Skødstrup', 8541, 'Skødstrup', 'l'),
]
# The towns that keep their label on a phone, where there is no room for all.
_MAJOR = frozenset((
    'Aarhus C', 'Risskov', 'Brabrand', 'Viby', 'Lystrup', 'Tranbjerg',
    'Beder', 'Harlev', 'Sabro', 'Skødstrup', 'Solbjerg', 'Trige'))
# Neighbouring municipalities named on the map, for orientation.
_REGIONS = [
    ('Favrskov', (10.03, 56.292)),
    ('Syddjurs', (10.345, 56.318)),
    ('Skanderborg', (9.985, 56.085)),
    ('Odder', (10.175, 55.9915)),
]
_LABEL_OFFSETS = {
    'r': (10, 4.5, 'start'),
    'l': (-10, 4.5, 'end'),
    't': (0, -11, 'middle'),
    'b': (0, 20, 'middle'),
}


class _Projection:
    """Maps longitude and latitude to pixels inside the drawn area."""

    def __init__(self, view: Sequence[float]):
        self.west, self.south, self.east, self.north = view
        self.shrink = math.cos(math.radians((self.south + self.north) / 2))
        self.width = self.x(self.east)
        self.height = self.y(self.south)

    def x(self, lon: float) -> float:
        return (lon - self.west) * self.shrink * _PX_PER_DEGREE

    def y(self, lat: float) -> float:
        return (self.north - lat) * _PX_PER_DEGREE

    def path(self, points: Sequence[Sequence[float]], close: bool) -> str:
        d = 'M' + 'L'.join(
            f'{self.x(lon):.1f} {self.y(lat):.1f}' for lon, lat in points)
        return d + 'Z' if close else d


def _town(projection: _Projection, places, centre, town) -> str:
    name, postcode, position, side = town
    lon, lat = places[position] if isinstance(position, str) else position
    x, y = projection.x(lon), projection.y(lat)
    dx, dy, anchor = _LABEL_OFFSETS[side]
    delay = math.hypot(x - centre[0], y - centre[1]) * 3
    css = 'town town-major' if name in _MAJOR else 'town'
    return (
        f'<g class="{css}" data-town="{name}" data-postcode="{postcode}" '
        f'style="--d:{delay:.0f}ms"><title>{postcode} {name}</title>'
        f'<circle class="town-hit" cx="{x:.1f}" cy="{y:.1f}" r="14"/>'
        f'<circle class="town-dot" cx="{x:.1f}" cy="{y:.1f}" r="4.5"/>'
        f'<text x="{x + dx:.1f}" y="{y + dy:.1f}" '
        f'text-anchor="{anchor}">{name}</text></g>')


def _map() -> str:
    data = json.loads(
        (_TOOLS / 'aarhus-map.json').read_text(encoding='utf-8'))
    projection = _Projection(data['view'])
    width, height = projection.width, projection.height

    around = ''.join(
        projection.path(ring, close=True)
        for name, rings in data['land'].items() if name != 'Aarhus'
        for ring in rings)
    home = ''.join(
        projection.path(ring, close=True) for ring in data['land']['Aarhus'])
    lakes = ''.join(
        projection.path(ring, close=True) for ring in data['lakes'])
    roads = ''.join(
        projection.path(line, close=False) for line in data['roads'])

    regions = ''.join(
        f'<text class="region" x="{projection.x(lon):.1f}" '
        f'y="{projection.y(lat):.1f}">{name}</text>'
        for name, (lon, lat) in _REGIONS)
    centre = (projection.x(10.2050), projection.y(56.1530))
    towns = ''.join(
        _town(projection, data['places'], centre, town) for town in _TOWNS)

    bar = 5 / _KM_PER_DEGREE * _PX_PER_DEGREE
    left, base = width - bar - 24, height - 24
    scale = (
        f'<g class="scale"><path d="M{left:.1f} {base - 6:.1f}V{base:.1f}'
        f'H{left + bar:.1f}V{base - 6:.1f}"/>'
        f'<text x="{left + bar / 2:.1f}" y="{base - 9:.1f}">5 km</text></g>')
    bay_x, bay_y = projection.x(10.335), projection.y(56.125)
    return (
        f'<svg viewBox="0 0 {width:.0f} {height:.0f}" role="img" '
        'aria-label="Kort over Aarhus Kommune med de bydele, vi kører til">'
        f'<path class="around" d="{around}"/>'
        f'<path class="home" d="{home}"/>'
        f'<path class="lake" d="{lakes}"/>'
        f'<path class="road" d="{roads}"/>'
        f'<text class="bay" x="{bay_x:.1f}" y="{bay_y:.1f}">Aarhus Bugt</text>'
        f'{regions}{scale}{towns}</svg>')


def main():
    _OUT.write_text(_map(), encoding='utf-8')


if __name__ == '__main__':
    main()
