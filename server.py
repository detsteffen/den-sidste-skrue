#!/usr/bin/env python3
"""Serves the Den Sidste Skrue site and stores quote requests.

Static files come from site/. POST /api/lead appends the request as one
JSON line to leads.jsonl next to this file.

Usage: python3 server.py [port]
"""

import datetime
import functools
import http
import http.server
import json
import pathlib
import sys

_ROOT = pathlib.Path(__file__).parent
_LEADS = _ROOT / 'leads.jsonl'
_MAX_BODY_BYTES = 10_000
_FIELDS = ('task', 'details', 'timing', 'postcode', 'name', 'phone', 'email')


def _parse_lead(body: bytes) -> dict[str, str]:
    """Returns the stored form of a submitted quote request.

    Raises:
        ValueError: The body is not a JSON object with a name and a phone.
    """
    data = json.loads(body)
    if not isinstance(data, dict):
        raise ValueError('Expected a JSON object.')
    lead = {field: str(data.get(field, '')).strip() for field in _FIELDS}
    if not lead['name'] or not lead['phone']:
        raise ValueError('Name and phone are required.')
    now = datetime.datetime.now().astimezone()
    return {'received': now.isoformat(timespec='seconds'), **lead}


class _Handler(http.server.SimpleHTTPRequestHandler):
    """Static file handler that also accepts quote requests."""

    def do_POST(self):  # http.server name, so pylint: disable=invalid-name
        length = int(self.headers.get('Content-Length', 0))
        if self.path != '/api/lead' or not 0 < length <= _MAX_BODY_BYTES:
            self.send_error(http.HTTPStatus.BAD_REQUEST)
            return
        try:
            lead = _parse_lead(self.rfile.read(length))
        except ValueError as e:
            self.send_error(http.HTTPStatus.BAD_REQUEST, str(e))
            return
        with _LEADS.open('a', encoding='utf-8') as f:
            f.write(json.dumps(lead, ensure_ascii=False) + '\n')
        self.send_response(http.HTTPStatus.NO_CONTENT)
        self.end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8040
    handler = functools.partial(_Handler, directory=str(_ROOT / 'site'))
    with http.server.HTTPServer(('127.0.0.1', port), handler) as server:
        server.serve_forever()


if __name__ == '__main__':
    main()
