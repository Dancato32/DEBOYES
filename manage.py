#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    # Change directory to backend so manage.py finds the settings and apps
    os.chdir("backend")
    
    # Add the current directory (backend) to the sys.path
    sys.path.insert(0, os.path.abspath("."))
    
    # Delegate to the real manage.py logic
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
