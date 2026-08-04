import zipfile
import sys
import os

aab_path = sys.argv[1]
temp_path = aab_path + ".tmp"
with zipfile.ZipFile(aab_path, 'r') as z_in, zipfile.ZipFile(temp_path, 'w') as z_out:
    for item in z_in.infolist():
        if not item.filename.startswith("META-INF/"):
            z_out.writestr(item, z_in.read(item.filename))
os.remove(aab_path)
os.rename(temp_path, aab_path)
print("Stripped META-INF successfully")
