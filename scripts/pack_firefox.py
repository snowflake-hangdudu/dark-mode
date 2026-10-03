"""Build the Firefox release XPI with its Firefox-specific manifest."""
from pack_common import package_release


if __name__ == "__main__":
    package_release("manifest.firefox.json", "dark-mode-firefox.xpi")
