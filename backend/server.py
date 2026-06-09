#!/usr/bin/env python3
"""
GymSword backend launcher.

Supervisor's READONLY config invokes `uvicorn server:app`. To run a pure Node.js
backend without modifying supervisor, this file performs an `execvp` at import
time, replacing the Python interpreter with the Node.js process so that Node
binds port 8001 in place of uvicorn. No Python application logic exists in this
project - this file is purely a platform bootstrap.
"""
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.flush()
sys.stderr.flush()
os.execvp("node", ["node", "src/server.js"])
