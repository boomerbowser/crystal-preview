"""Compare two PNG captures pixel by pixel.

Visual evidence is the acceptance mechanism for Crystal changes, and a material
can become visually indistinguishable while every token and contrast check still
passes. This decodes PNGs directly so the comparison needs no image library.

    python3 tools/compare-captures.py BEFORE.png AFTER.png [--tolerance N]
                                     [--max-differing N]

Exits non-zero when the images differ beyond the tolerance, so it can gate a
build. Both ceilings default to zero, which means exact equality: that is the
right setting when proving that a change altered nothing, and it is how the
gates in this project are run.

The ceilings are deliberately separate rather than a single "percentage
changed" figure, which would let a real change hide inside an allowance.

  --tolerance      per-channel delta below which two pixels count as the same
                   colour. Above 2 this stops describing rasterisation noise.
  --max-differing  how many pixels may exceed --tolerance.
  --visible-delta  the delta at which a difference is considered visible to a
                   person. A single pixel beyond it fails the comparison no
                   matter what --max-differing says.

That last rule is what keeps the allowance honest: --max-differing forgives a
scatter of near-invisible rasterisation dither, but it can never forgive a
pixel that actually changed colour, however few of them there are.
"""
import argparse
import struct
import sys
import zlib
from pathlib import Path

CHANNELS = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}


def decode(path):
    """Return (width, height, channels, raw RGBA-ish bytes) for a PNG."""
    data = Path(path).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"{path}: not a PNG")
    pos, width, height, colour, depth, idat = 8, None, None, None, None, b""
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        kind = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, colour = struct.unpack(">IIBB", chunk[:10])
        elif kind == b"IDAT":
            idat += chunk
        elif kind == b"IEND":
            break
        pos += 12 + length
    if depth != 8:
        raise SystemExit(f"{path}: only 8-bit PNGs are supported, got {depth}-bit")
    if colour not in CHANNELS:
        raise SystemExit(f"{path}: unsupported colour type {colour}")

    channels = CHANNELS[colour]
    stride = width * channels
    raw = zlib.decompress(idat)
    out = bytearray()
    previous = bytearray(stride)
    offset = 0
    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        line = bytearray(raw[offset:offset + stride])
        offset += stride
        for x in range(stride):
            left = line[x - channels] if x >= channels else 0
            up = previous[x]
            upleft = previous[x - channels] if x >= channels else 0
            if filter_type == 1:
                line[x] = (line[x] + left) & 255
            elif filter_type == 2:
                line[x] = (line[x] + up) & 255
            elif filter_type == 3:
                line[x] = (line[x] + (left + up) // 2) & 255
            elif filter_type == 4:
                pa, pb, pc = abs(up - upleft), abs(left - upleft), abs(left + up - 2 * upleft)
                predictor = left if (pa <= pb and pa <= pc) else (up if pb <= pc else upleft)
                line[x] = (line[x] + predictor) & 255
        out += line
        previous = line
    return width, height, channels, bytes(out)


def compare(before, after, tolerance=0, visible_delta=24):
    """Return (pixels over the tolerance, worst delta, pixels visibly changed)."""
    bw, bh, bc, ba = decode(before)
    aw, ah, ac, aa = decode(after)
    if (bw, bh) != (aw, ah):
        return None, f"dimensions differ: {bw}x{bh} vs {aw}x{ah}", None

    differing = 0
    worst = 0
    visible = 0
    step = min(bc, ac)
    for i in range(0, len(ba), bc):
        j = i // bc * ac
        delta = max(abs(ba[i + k] - aa[j + k]) for k in range(min(3, step)))
        if delta > tolerance:
            differing += 1
            worst = max(worst, delta)
            if delta > visible_delta:
                visible += 1
    return differing, worst, visible


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before")
    parser.add_argument("after")
    parser.add_argument("--tolerance", type=int, default=0,
                        help="per-channel delta below which two pixels count as "
                             "the same colour (default 0, meaning exact)")
    parser.add_argument("--max-differing", type=int, default=0,
                        help="how many pixels may exceed --tolerance before the "
                             "comparison fails (default 0)")
    parser.add_argument("--visible-delta", type=int, default=24,
                        help="delta at which a change counts as visible; one such "
                             "pixel fails regardless of --max-differing (default 24)")
    args = parser.parse_args()

    differing, worst, visible = compare(args.before, args.after,
                                        args.tolerance, args.visible_delta)
    if differing is None:
        print(f"FAIL  {worst}")
        return 1

    name = Path(args.after).name
    if differing == 0:
        print(f"PASS  {name}: identical")
        return 0

    total = decode(args.before)[0] * decode(args.before)[1]
    summary = (f"{differing} of {total} pixels differ "
               f"({differing / total * 100:.4f}%), worst channel delta {worst}")

    if visible:
        # Never forgiven by the allowance: something actually changed colour.
        print(f"FAIL  {name}: {summary}; {visible} pixel(s) changed visibly "
              f"(delta over {args.visible_delta})")
        return 1

    if differing <= args.max_differing:
        # Within the declared noise allowance. Say so explicitly rather than
        # printing "identical", because the images are not identical.
        print(f"PASS  {name}: {summary}; within the allowance of "
              f"{args.max_differing} pixels above a delta of {args.tolerance}")
        return 0

    print(f"FAIL  {name}: {summary}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
