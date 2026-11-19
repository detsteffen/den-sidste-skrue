#!/usr/bin/env python3
"""Draws the interactive house and writes it to src/drawings/house.svg.

The house is an isometric drawing built from measurements in metres. Two
scenes share one footprint: the outside, and the inside with the roof and
the two near walls removed. Every part carries the task it stands for, so
the page can light it up and open the quote form for it.

Run it after changing a measurement:

    python3 tools/draw_house.py
"""

from collections.abc import Sequence
import math
import pathlib
from typing import TypeAlias

_OUT = pathlib.Path(__file__).parent.parent / 'src/drawings/house.svg'
_COS = math.cos(math.radians(30))
_PX_PER_METRE = 44
_WALL = 2.9
_RIDGE = 4.8
_SLOPE = (_RIDGE - _WALL) / 3
_EAVE = _WALL - _SLOPE * 0.3
_DECK = 0.28
# The floor inside sits on the plinth, level with the front door's sill.
_FLOOR = 0.3
_CEILING = 2.5
_STUB = 0.25
# The page zooms in on the inside scene, so its tags are drawn smaller.
_ROOM_ZOOM_TAGS = 0.76

_Point: TypeAlias = tuple[float, ...]


def _iso(x: float, y: float, z: float = 0.0) -> tuple[float, float]:
    """Projects a point in metres to isometric screen pixels."""
    return ((x - y) * _COS * _PX_PER_METRE,
            ((x + y) / 2 - z) * _PX_PER_METRE)


def _d(corners: Sequence[_Point]) -> str:
    return 'M' + 'L'.join(
        '{:.1f} {:.1f}'.format(*_iso(*corner)) for corner in corners) + 'Z'


def _poly(corners: Sequence[_Point], css: str = 'fill') -> str:
    return f'<path class="{css}" d="{_d(corners)}"/>'


def _frame(outer: Sequence[_Point], inner: Sequence[_Point]) -> str:
    """Returns a surface with a hole, such as the casing round a window."""
    return (f'<path class="fill" fill-rule="evenodd" '
            f'd="{_d(outer)}{_d(inner)}"/>')


def _lines(
    segments: Sequence[tuple[_Point, _Point]],
    css: str = 'detail',
) -> str:
    path = ''.join(
        'M{:.1f} {:.1f}L{:.1f} {:.1f}'.format(*_iso(*start), *_iso(*end))
        for start, end in segments)
    return f'<path class="{css}" d="{path}"/>'


def _box(
    x: tuple[float, float],
    y: tuple[float, float],
    z: tuple[float, float],
) -> str:
    """Returns the three faces of a box that the viewer can see."""
    (x1, x2), (y1, y2), (z1, z2) = x, y, z
    return (
        _poly([(x1, y1, z2), (x2, y1, z2), (x2, y2, z2), (x1, y2, z2)])
        + _poly([(x1, y2, z1), (x2, y2, z1), (x2, y2, z2), (x1, y2, z2)])
        + _poly([(x2, y1, z1), (x2, y2, z1), (x2, y2, z2), (x2, y1, z2)]))


def _part(task: str, order: int, shapes: Sequence[str], css: str) -> str:
    return (f'<g class="part {css}" data-task="{task}" '
            f'style="--i:{order}">{"".join(shapes)}</g>')


def _tag(
    text: str,
    anchor: _Point,
    order: int,
    attributes: str,
    scale: float = 1.0,
) -> str:
    x, y = _iso(*anchor)
    width = (len(text) * 13.5 + 40) * scale
    half = 23 * scale
    return (f'<g class="tag" {attributes} style="--i:{order}">'
            f'<rect x="{x - width / 2:.1f}" y="{y - half:.1f}" '
            f'width="{width:.1f}" height="{2 * half:.1f}" rx="{half:.1f}"/>'
            f'<text x="{x:.1f}" y="{y + 8 * scale:.1f}" '
            f'font-size="{22 * scale:.1f}">{text}</text></g>')


def _task_tag(
    task: str,
    text: str,
    anchor: _Point,
    order: int,
    scale: float = 1.0,
) -> str:
    return _tag(text, anchor, order, f'data-task="{task}"', scale)


def _gable_top(y: float) -> float:
    return _WALL + _SLOPE * (3 - abs(y - 3))


def _front(x1: float, x2: float, z1: float, z2: float) -> list[_Point]:
    """Returns a rectangle on the front wall."""
    return [(x1, 6, z1), (x2, 6, z1), (x2, 6, z2), (x1, 6, z2)]


def _outside() -> str:
    studs = [-4.6 + 0.575 * i for i in range(1, 8)]
    extension = _part('Tilbygning', 1, [
        _poly([(-4.6, 1.2, 2.5), (0, 1.2, 2.5), (0, 5, 2.5),
               (-4.6, 5, 2.5)]),
        _lines([((x, 1.2, 2.5), (x, 5, 2.5)) for x in studs]),
        _poly([(-4.6, 5, 0), (0, 5, 0), (0, 5, 2.5), (-4.6, 5, 2.5)]),
        _lines([((x, 5, 0), (x, 5, 2.5)) for x in studs]
               + [((-4.6, 5, 1.25), (0, 5, 1.25)),
                  ((-4.6, 5, 0), (-2.875, 5, 2.5))]),
    ], 'stays')

    cladding = []
    for i in range(1, 15):
        y = 0.4 * i
        if 2.2 <= y <= 3.8:
            cladding.append(((10, y, 0.3), (10, y, 0.9)))
            cladding.append(((10, y, 2.2), (10, y, _gable_top(y))))
        else:
            cladding.append(((10, y, 0.3), (10, y, _gable_top(y))))
    facade = _part('Facade og beklædning', 2, [
        _poly(_front(0, 10, 0, _WALL)),
        _poly([(10, 0, 0), (10, 6, 0), (10, 6, _WALL), (10, 3, _RIDGE),
               (10, 0, _WALL)]),
        _lines(cladding + [((0, 6, 0.3), (10, 6, 0.3)),
                           ((10, 6, 0.3), (10, 0, 0.3))]),
    ], 'drops')

    windows = _part('Vinduer og døre', 3, [
        _poly(_front(4.4, 6.4, 0.3, 2.45), 'glass'),
        _poly(_front(7.3, 9.0, 0.9, 2.35), 'glass'),
        _poly([(10, 2.2, 0.9), (10, 3.8, 0.9), (10, 3.8, 2.2),
               (10, 2.2, 2.2)], 'glass'),
        _lines([((5.4, 6, 0.3), (5.4, 6, 2.45)),
                ((8.15, 6, 0.9), (8.15, 6, 2.35)),
                ((10, 3, 0.9), (10, 3, 2.2))]),
    ], 'drops')

    door = ('<g class="part door drops" data-enter style="--i:3">'
            + _box((0.6, 2.2), (6, 6.8), (0, 0.3))
            + _poly(_front(0.9, 1.9, 0.3, 2.4), 'entrance')
            + '</g>')

    tiles = [((-0.4, 6.3 - 3.3 * t, _EAVE + (_RIDGE - _EAVE) * t),
              (10.4, 6.3 - 3.3 * t, _EAVE + (_RIDGE - _EAVE) * t))
             for t in (1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6)]
    chimney = _RIDGE - _SLOPE * 0.4
    roof = _part('Tag', 5, [
        _poly([(-0.4, 6.3, _EAVE), (10.4, 6.3, _EAVE), (10.4, 3, _RIDGE),
               (-0.4, 3, _RIDGE)], 'roof'),
        _lines(tiles, 'tile'),
        _poly([(-0.4, 6.3, _EAVE), (10.4, 6.3, _EAVE),
               (10.4, 6.3, _EAVE - 0.28), (-0.4, 6.3, _EAVE - 0.28)],
              'roof-edge'),
        _poly([(10.4, 6.3, _EAVE), (10.4, 3, _RIDGE), (10.4, -0.3, _EAVE),
               (10.4, -0.3, _EAVE - 0.28), (10.4, 3, _RIDGE - 0.28),
               (10.4, 6.3, _EAVE - 0.28)], 'roof-edge'),
        _poly([(6.5, 3.4, chimney), (7.3, 3.4, chimney), (7.3, 3.4, 5.7),
               (6.5, 3.4, 5.7)]),
        _poly([(7.3, 3.4, chimney), (7.3, 3, _RIDGE), (7.3, 2.6, chimney),
               (7.3, 2.6, 5.7), (7.3, 3.4, 5.7)]),
        _poly([(6.5, 2.6, 5.7), (7.3, 2.6, 5.7), (7.3, 3.4, 5.7),
               (6.5, 3.4, 5.7)]),
    ], 'lifts')

    boards = [((3.2, 6 + 0.38 * i, _DECK), (9.2, 6 + 0.38 * i, _DECK))
              for i in range(1, 10)]
    terrace = _part('Terrasse og træværk', 4, [
        _box((3.2, 9.2), (6, 9.8), (0, _DECK)),
        _lines(boards),
    ], 'stays')

    shed_boards = [((x / 10, 10.6, 0), (x / 10, 10.6, 2.3))
                   for x in range(-50, -16, 4)]
    carport = _part('Carport og skur', 6, [
        _poly([(-5.4, 10.6, 0), (-1.6, 10.6, 0), (-1.6, 10.6, 2.3),
               (-5.4, 10.6, 2.3)]),
        _lines(shed_boards),
        _poly([(-4.0, 10.6, 0), (-3.1, 10.6, 0), (-3.1, 10.6, 2.0),
               (-4.0, 10.6, 2.0)]),
        _poly([(-1.6, 9.4, 0), (-1.6, 10.6, 0), (-1.6, 10.6, 2.3),
               (-1.6, 9.4, 2.3)]),
        _lines([((-1.6, 6.9, 0), (-1.6, 6.9, 2.3))], 'post'),
        _box((-5.6, -1.4), (6.6, 10.8), (2.3, 2.5)),
    ], 'stays')

    tags = [
        _task_tag('Tilbygning', 'Tilbygning', (-2.3, 5, 1.25), 7),
        _task_tag('Facade og beklædning', 'Facade', (10, 1.05, 1.35), 8),
        _task_tag('Vinduer og døre', 'Vinduer og døre', (8.15, 6, 1.6), 9),
        _task_tag('Terrasse og træværk', 'Terrasse', (6.2, 8.1, _DECK), 10),
        _task_tag('Carport og skur', 'Carport og skur', (-3.5, 10.6, 1.1),
                  11),
        _task_tag('Tag', 'Tag', (4.4, 4.7, 3.8), 12),
        _tag('Gå indenfor', (1.4, 6, 1.3), 13, 'data-enter'),
    ]
    return ''.join(
        [extension, facade, windows, door, roof, terrace, carport] + tags)


def _lift(corners: Sequence[_Point]) -> list[_Point]:
    """Raises points measured from the floor to their real height."""
    return [(x, y, z + _FLOOR) for x, y, z in corners]


def _room_box(
    x: tuple[float, float],
    y: tuple[float, float],
    z: tuple[float, float],
) -> str:
    return _box(x, y, (z[0] + _FLOOR, z[1] + _FLOOR))


def _room_lines(segments: Sequence[tuple[_Point, _Point]]) -> str:
    return _lines([tuple(_lift(segment)) for segment in segments])


def _room_tag(task: str, text: str, anchor: _Point, order: int) -> str:
    return _task_tag(task, text, _lift([anchor])[0], order, _ROOM_ZOOM_TAGS)


def _inside() -> str:
    planks = [((3.15 if y < 2.75 else 0, y, 0), (10, y, 0))
              for y in (0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5)]
    floors = _part('Gulve', 1, [
        _box((0, 10), (0, 6), (0, _FLOOR)),
        _room_lines(planks),
    ], '')

    walls = _part('Vægge', 2, [
        _room_box((0, 10), (-0.2, 0), (0, _CEILING)),
        _room_box((-0.2, 0), (-0.2, 6), (0, _CEILING)),
        _poly(_lift([(0, 3.6, 0.9), (0, 5.2, 0.9), (0, 5.2, 2.1),
                     (0, 3.6, 2.1)]), 'glass'),
        _room_lines([((0, 4.4, 0.9), (0, 4.4, 2.1))]),
    ], '')

    grid = [i / 2 for i in range(1, 6)]
    bathroom = _part('Badeværelse og fliser', 3, [
        _poly(_lift([(0, 0, 0), (3, 0, 0), (3, 2.6, 0), (0, 2.6, 0)])),
        _poly(_lift([(0, 0, 0), (3, 0, 0), (3, 0, _CEILING),
                     (0, 0, _CEILING)])),
        _poly(_lift([(0, 0, 0), (0, 2.6, 0), (0, 2.6, _CEILING),
                     (0, 0, _CEILING)])),
        _room_lines(
            [((x, 0, 0), (x, 2.6, 0)) for x in grid]
            + [((0, y, 0), (3, y, 0)) for y in grid]
            + [((x, 0, 0), (x, 0, _CEILING)) for x in grid]
            + [((0, y, 0), (0, y, _CEILING)) for y in grid]
            + [((0, 0, z), (3, 0, z)) for z in (0.5, 1, 1.5, 2)]
            + [((0, 0, z), (0, 2.6, z)) for z in (0.5, 1, 1.5, 2)]),
        _room_box((0.2, 1.0), (0.4, 2.1), (0, 0.55)),
        _poly(_lift([(0.3, 0.5, 0.55), (0.9, 0.5, 0.55), (0.9, 2.0, 0.55),
                     (0.3, 2.0, 0.55)])),
    ], '')

    trim = _part('Lister og finish', 4, [
        _poly(_lift([(0, 2.75, 0), (0, 6, 0), (0, 6, 0.5),
                     (0, 2.75, 0.5)]), 'hit'),
        _poly(_lift([(0, 2.75, 0), (0, 6, 0), (0, 6, 0.16),
                     (0, 2.75, 0.16)])),
        _frame(_lift([(0, 3.44, 0.76), (0, 5.36, 0.76), (0, 5.36, 2.24),
                      (0, 3.44, 2.24)]),
               _lift([(0, 3.6, 0.9), (0, 5.2, 0.9), (0, 5.2, 2.1),
                      (0, 3.6, 2.1)])),
    ], '')

    ceiling = _part('Lofter', 5, [
        _poly(_lift([(0, 0, _CEILING), (10, 0, _CEILING),
                     (10, 0.9, _CEILING), (0.9, 0.9, _CEILING),
                     (0.9, 6, _CEILING), (0, 6, _CEILING)])),
        _room_lines(
            [((x, 0, _CEILING), (x, 0.9, _CEILING)) for x in range(1, 10)]
            + [((0, y, _CEILING), (0.9, y, _CEILING))
               for y in range(2, 6)]),
    ], '')

    doors = [((3.6 + 0.6 * i, 0.62, 0), (3.6 + 0.6 * i, 0.62, 0.9))
             for i in range(1, 10)]
    kitchen = _part('Køkken', 6, [
        _room_box((3.6, 7.4), (0, 0.36), (1.45, 2.15)),
        _room_box((3.6, 9.6), (0, 0.62), (0, 0.9)),
        _room_lines(doors + [((3.6, 0.62, 0.72), (9.6, 0.62, 0.72))]),
        _room_box((5.2, 7.8), (2.1, 3.0), (0, 0.9)),
        _room_lines([((6.5, 3.0, 0), (6.5, 3.0, 0.9))]),
    ], '')

    stubs = _part('Vægge', 7, [
        _room_box((0, 3.15), (2.6, 2.75), (0, _STUB)),
        _room_box((3, 3.15), (0, 1.5), (0, _STUB)),
        _room_box((3, 3.15), (2.4, 2.6), (0, _STUB)),
    ], '')

    door = _part('Indvendige døre', 8, [
        _poly(_lift([(3.15, 1.5, 0), (3.15, 2.4, 0), (3.15, 2.4, 2.1),
                     (3.15, 1.5, 2.1)])),
        _room_lines([((3.15, 1.62, 0.12), (3.15, 2.28, 0.12)),
                     ((3.15, 2.28, 0.12), (3.15, 2.28, 1.98)),
                     ((3.15, 2.28, 1.98), (3.15, 1.62, 1.98)),
                     ((3.15, 1.62, 1.98), (3.15, 1.62, 0.12)),
                     ((3.15, 2.2, 1.0), (3.15, 2.08, 1.0))]),
    ], '')

    tags = [
        _room_tag('Lofter', 'Lofter', (5.4, 0.45, _CEILING), 9),
        _room_tag('Vægge', 'Vægge', (8.7, 0, 1.6), 10),
        _room_tag('Badeværelse og fliser', 'Bad og fliser', (1.6, 1.5, 0),
                  11),
        _room_tag('Køkken', 'Køkken', (6.5, 2.55, 0.9), 12),
        _room_tag('Indvendige døre', 'Døre', (3.15, 1.95, 2.3), 13),
        _room_tag('Lister og finish', 'Lister', (0, 4.6, 0.3), 14),
        _room_tag('Gulve', 'Gulve', (6.6, 4.7, 0), 15),
    ]
    return ''.join(
        [floors, walls, bathroom, trim, ceiling, kitchen, stubs, door]
        + tags)


def _house() -> str:
    left = _iso(-6, 11.2)[0] - 8
    top = _iso(-0.4, 3, _RIDGE)[1] - 12
    width = _iso(11, 0.6)[0] + 8 - left
    height = _iso(11, 11.2)[1] + 8 - top
    room_x, room_y = _iso(5, 3, 1.3)
    ground = _poly([(-6, 0.6), (11, 0.6), (11, 11.2), (-6, 11.2)], 'ground')
    return (
        f'<svg viewBox="{left:.0f} {top:.0f} {width:.0f} {height:.0f}" '
        f'style="--room-x:{(room_x - left) / width:.1%};'
        f'--room-y:{(room_y - top) / height:.1%}">{ground}'
        f'<g class="scene outside">{_outside()}</g>'
        f'<g class="scene inside">{_inside()}</g></svg>')


def main():
    _OUT.write_text(_house(), encoding='utf-8')


if __name__ == '__main__':
    main()
