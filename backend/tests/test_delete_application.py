import urllib.request
import json

def test_backend_status():
    try:
        res = urllib.request.urlopen("http://127.0.0.1:8000/docs")
        print("Backend Status:", res.getcode())
    except Exception as e:
        print("Backend check failed:", e)

if __name__ == "__main__":
    test_backend_status()
