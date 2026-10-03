"""Build the Chromium release ZIP from runtime files only."""
from pack_common import package_release


if __name__ == "__main__":
    package_release("manifest.json", "dark-mode-chromium.zip")
