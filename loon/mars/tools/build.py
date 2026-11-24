#!/usr/bin/env python3
"""Compatibility entry point: v1 is retired after confirmed loss of front hops on iPhone."""
import sys
from build_premium import main
if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('Build failed: '+type(exc).__name__+'; private values suppressed.',file=sys.stderr)
        sys.exit(1)
