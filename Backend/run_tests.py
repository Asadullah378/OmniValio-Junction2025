#!/usr/bin/env python
"""
Simple test runner script
"""
import subprocess
import sys

def run_tests():
    """Run pytest with appropriate flags"""
    cmd = ["pytest", "-v", "--tb=short"]
    
    # Add coverage if pytest-cov is installed
    try:
        import pytest_cov
        cmd.extend(["--cov=app", "--cov-report=term-missing"])
    except ImportError:
        pass
    
    result = subprocess.run(cmd)
    return result.returncode

if __name__ == "__main__":
    sys.exit(run_tests())

