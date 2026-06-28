# -*- coding: utf-8 -*-
"""Fix en-dash title separator in mdr-wordpress Docker container."""
import subprocess, sys

CONTAINER = "mdr-wordpress"
FUNCTIONS_PATH = "/var/www/html/wp-content/themes/mdr-theme/functions.php"

# Step 1: Check if filter already exists
r = subprocess.run(
    ["docker", "exec", CONTAINER, "grep", "-c", "document_title_separator", FUNCTIONS_PATH],
    capture_output=True, text=True
)
count_str = r.stdout.strip()
already = count_str.isdigit() and int(count_str) > 0
if already:
    print("filter already present, count:", count_str)
else:
    # Write a temp file with the filter, then cat it into functions.php
    tmp = "/tmp/title_sep_filter.php"
    php_line = "add_filter('document_title_separator', function() { return '|'; });"
    # Write temp file
    r_write = subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-c",
         "printf '\\n%s\\n' \"" + php_line + "\" > " + tmp],
        capture_output=True, text=True
    )
    if r_write.returncode != 0:
        print("ERROR writing tmp:", r_write.stderr)
        sys.exit(1)
    # Append to functions.php
    r_append = subprocess.run(
        ["docker", "exec", CONTAINER, "sh", "-c",
         "cat " + tmp + " >> " + FUNCTIONS_PATH],
        capture_output=True, text=True
    )
    if r_append.returncode != 0:
        print("ERROR appending:", r_append.stderr)
        sys.exit(1)
    print("filter appended OK")

# Step 2: Verify via WP-CLI
r3 = subprocess.run(
    ["docker", "exec", CONTAINER, "wp", "--allow-root",
     "eval", "echo apply_filters('document_title_separator', '---');",
     "--path=/var/www/html"],
    capture_output=True, text=True
)
print("separator result:", repr(r3.stdout.strip()), "err:", r3.stderr.strip()[:120])

# Step 3: Flush object cache
r4 = subprocess.run(
    ["docker", "exec", CONTAINER, "wp", "--allow-root",
     "cache", "flush", "--path=/var/www/html"],
    capture_output=True, text=True
)
print("cache flush:", r4.stdout.strip(), r4.stderr.strip()[:80])
print("DONE")
