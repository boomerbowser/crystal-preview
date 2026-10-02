#!/usr/bin/env python3
"""The visual gate's allowance cannot hide a visible change.

`verify-frames.mjs` forgives up to 400 pixels differing by more than a channel
delta of 2, because GPU rasterisation dithers gradients between runs on the same
machine. An allowance like that is only safe if it is bounded by something the
allowance itself cannot raise. `validation/baselines/README.md` and the comment
in `verify-frames.mjs` name this file as the proof, so it has to exist and run
(D-13).

    python3 tests/visual-gate-contracts.py
"""
import os
import subprocess
import sys
import tempfile
import zlib
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
COMPARE = os.path.join(HERE, '..', 'tools', 'compare-captures.py')

results = []


def png(path, pixels, width, height):
    """Write a minimal RGB PNG. No image library: the comparator decodes PNGs
    itself for the same reason, and a test that needed Pillow would not run
    everywhere the gate does."""
    raw = b''.join(b'\x00' + bytes(pixels[y]) for y in range(height))
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    head = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', head)
                + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))


def compare(before, after, *args):
    proc = subprocess.run([sys.executable, COMPARE, before, after, *args],
                          capture_output=True, text=True)
    return proc.returncode, (proc.stdout + proc.stderr).strip()


def check(name, fn):
    try:
        fn()
        results.append({'name': name, 'status': 'pass'})
    except AssertionError as error:
        results.append({'name': name, 'status': 'fail', 'detail': str(error)})


WIDTH = HEIGHT = 64
GREY = [[128] * (WIDTH * 3) for _ in range(HEIGHT)]


def with_pixel(colour, x=10, y=10):
    rows = [row[:] for row in GREY]
    rows[y][x * 3:x * 3 + 3] = list(colour)
    return rows


with tempfile.TemporaryDirectory() as work:
    base = os.path.join(work, 'base.png')
    png(base, GREY, WIDTH, HEIGHT)

    def one_visible_pixel_fails_any_allowance():
        after = os.path.join(work, 'black.png')
        png(after, with_pixel((0, 0, 0)), WIDTH, HEIGHT)
        code, out = compare(base, after, '--tolerance', '2', '--max-differing', '1000000')
        assert code != 0, (
            'one black pixel on a grey field passed with the allowance set to a million. '
            f'The allowance can hide a visible change. Output: {out}')

    def a_dithered_pixel_is_forgiven():
        after = os.path.join(work, 'dither.png')
        png(after, with_pixel((130, 130, 130)), WIDTH, HEIGHT)
        code, out = compare(base, after, '--tolerance', '2', '--max-differing', '400')
        assert code == 0, (
            'a two-step channel difference failed, so the gate cannot tell rasterisation '
            f'dither from a change and will be re-blessed into meaninglessness. Output: {out}')

    def the_default_forgives_nothing():
        after = os.path.join(work, 'faint.png')
        png(after, with_pixel((129, 128, 128)), WIDTH, HEIGHT)
        code, out = compare(base, after)
        assert code != 0, (
            'a one-step difference passed in the comparator default mode, which the other '
            f'gates rely on for exact equality. Output: {out}')

    def the_visible_threshold_is_what_bounds_it():
        """Just under the threshold is forgiven and just over it fails, however
        large the allowance. This boundary is what makes the allowance safe."""
        under = os.path.join(work, 'under.png')
        png(under, with_pixel((128 + 24, 128, 128)), WIDTH, HEIGHT)
        code, out = compare(base, under, '--tolerance', '2', '--max-differing', '1000000')
        assert code == 0, f'a delta of exactly 24 failed, so the threshold is not 24. Output: {out}'

        over = os.path.join(work, 'over.png')
        png(over, with_pixel((128 + 25, 128, 128)), WIDTH, HEIGHT)
        code, out = compare(base, over, '--tolerance', '2', '--max-differing', '1000000')
        assert code != 0, f'a delta of 25 passed with a million-pixel allowance. Output: {out}'

    check('one visible pixel fails however large the allowance', one_visible_pixel_fails_any_allowance)
    check('a two-step dither is forgiven', a_dithered_pixel_is_forgiven)
    check('the comparator default forgives nothing', the_default_forgives_nothing)
    check('the visible threshold is what bounds the allowance', the_visible_threshold_is_what_bounds_it)

failures = [r for r in results if r['status'] == 'fail']
print({'suite': 'visual gate contracts', 'checks': len(results), 'failures': failures})
sys.exit(1 if failures else 0)
