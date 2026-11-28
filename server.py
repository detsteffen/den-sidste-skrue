#!/usr/bin/env python3
"""Serves the built Den Sidste Skrue site and stores quote requests.

Static files come from dist/ (run `npm run build` first). POST /api/lead
takes the quote form as multipart/form-data and stores each request in its
own folder under leads/: lead.json plus the attached photos and drawings.

Usage: python3 server.py [port] [host]

The host defaults to 127.0.0.1; in a container it is 0.0.0.0, so the proxy
in front can reach it.
"""

import datetime
import email
import email.message
import email.policy
import functools
import http
import http.server
import json
import pathlib
import secrets
import sys

_ROOT = pathlib.Path(__file__).parent
_LEADS = _ROOT / 'leads'
_FIELDS = ('name', 'phone', 'email', 'postcode', 'details')
_MAX_FILES = 8
_MAX_FILE_BYTES = 10 * 1024 * 1024
_MAX_BODY_BYTES = _MAX_FILES * _MAX_FILE_BYTES + 1024 * 1024
# The stored file gets its extension from the declared type, never from
# the name the browser sent.
_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
}


def _parts(
    content_type: str,
    body: bytes,
) -> list[email.message.EmailMessage]:
    """Returns the parts of a multipart/form-data request body.

    Raises:
        ValueError: The body is not multipart/form-data.
    """
    header = f'Content-Type: {content_type}\r\n\r\n'.encode()
    message = email.message_from_bytes(
        header + body, policy=email.policy.HTTP)
    if message.get_content_type() != 'multipart/form-data':
        raise ValueError('Expected multipart/form-data.')
    return list(message.iter_parts())


def _read_lead(
    parts: list[email.message.EmailMessage],
) -> tuple[dict[str, str], list[tuple[str, bytes]], bool]:
    """Splits a submitted form into the lead and its attached files.

    Returns:
        The lead as stored in lead.json, one (extension, content) pair per
        attached file, and whether the hidden trap field was filled in.

    Raises:
        ValueError: A field is missing, or a file is too large, of a type
          we do not take, or one too many.
    """
    fields: dict[str, str] = {}
    files: list[tuple[str, bytes]] = []
    for part in parts:
        name = part.get_param('name', header='content-disposition')
        content = part.get_payload(decode=True)
        if name is None or content is None:
            raise ValueError('Malformed form part.')
        if name != 'files':
            fields[name] = content.decode('utf-8', 'replace').strip()
            continue
        kind = part.get_content_type()
        if kind not in _EXTENSIONS:
            raise ValueError(f'File type not accepted: {kind}')
        if len(content) > _MAX_FILE_BYTES:
            raise ValueError('A file is larger than 10 MB.')
        files.append((_EXTENSIONS[kind], content))
    if len(files) > _MAX_FILES:
        raise ValueError(f'More than {_MAX_FILES} files.')
    missing = [field for field in _FIELDS if not fields.get(field)]
    if missing:
        raise ValueError(f'Missing fields: {", ".join(missing)}')

    now = datetime.datetime.now().astimezone()
    lead = {
        'received': now.isoformat(timespec='seconds'),
        **{field: fields[field] for field in _FIELDS},
    }
    return lead, files, bool(fields.get('website'))


def _store(lead: dict[str, str], files: list[tuple[str, bytes]]) -> None:
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    folder = _LEADS / f'{stamp}-{secrets.token_hex(3)}'
    folder.mkdir(parents=True)
    for number, (extension, content) in enumerate(files, start=1):
        (folder / f'bilag-{number}{extension}').write_bytes(content)
    (folder / 'lead.json').write_text(
        json.dumps(lead, ensure_ascii=False, indent=2), encoding='utf-8')


class _Handler(http.server.SimpleHTTPRequestHandler):
    """Static file handler that also accepts quote requests."""

    # Without a charset, browsers and AI crawlers may read the Danish letters
    # in llms.txt and the Markdown copies of the guides as Latin-1.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.md': 'text/markdown; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
    }

    def send_error(self, code, message=None, explain=None):
        """Answers a missing page with the site's own 404 page."""
        if code != http.HTTPStatus.NOT_FOUND:
            super().send_error(code, message, explain)
            return
        page = (pathlib.Path(self.directory) / '404.html').read_bytes()
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(page)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(page)

    def do_POST(self):  # http.server name, so pylint: disable=invalid-name
        length = int(self.headers.get('Content-Length', 0))
        if self.path != '/api/lead' or not 0 < length <= _MAX_BODY_BYTES:
            self.send_error(http.HTTPStatus.BAD_REQUEST)
            return
        try:
            lead, files, trapped = _read_lead(_parts(
                self.headers.get('Content-Type', ''),
                self.rfile.read(length)))
        except ValueError as e:
            self.send_error(http.HTTPStatus.BAD_REQUEST, str(e))
            return
        # A filled trap field means a script wrote the form, not a person,
        # so it gets the same answer but nothing is kept.
        if not trapped:
            _store(lead, files)
        self.send_response(http.HTTPStatus.NO_CONTENT)
        self.end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8040
    host = sys.argv[2] if len(sys.argv) > 2 else '127.0.0.1'
    handler = functools.partial(_Handler, directory=str(_ROOT / 'dist'))
    # One thread per request, so a slow upload of photos does not hold up
    # every other visitor.
    with http.server.ThreadingHTTPServer((host, port), handler) as server:
        server.serve_forever()


if __name__ == '__main__':
    main()
