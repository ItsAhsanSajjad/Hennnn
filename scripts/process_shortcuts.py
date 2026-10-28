import os
import sys
from PIL import Image
import numpy as np

brain_dir = r"C:\Users\hello\.gemini\antigravity\brain\54536b9e-3c34-431e-9dbf-e3f97af63a62"
out_dir = r"D:\pak_hen\pakhen\pakhen\public\assets\dashboard\shortcuts"
os.makedirs(out_dir, exist_ok=True)

icons = {
    "shortcut-rewards": "shortcut_rewards_1789329582870.jpg",
    "shortcut-prizes": "shortcut_prizes_1789329629718.jpg",
    "shortcut-team": "shortcut_team_1789329677149.jpg",
    "shortcut-deposits": "shortcut_deposits_1789329727749.jpg",
    "shortcut-withdrawals": "shortcut_withdrawals_1789329782367.jpg",
    "shortcut-profit-egg": "shortcut_profit_egg_1789330006746.jpg",
    "shortcut-refer-bonus": "shortcut_refer_bonus_1789329843004.jpg",
    "shortcut-app-download": "shortcut_app_download_1789329903065.jpg",
    "shortcut-fbr-secp": "shortcut_fbr_secp_1789329970020.jpg",
    "shortcut-logout": "shortcut_logout_1789329985592.jpg",
}

from collections import deque

def remove_background(img_path):
    img = Image.open(img_path).convert("RGBA")
    w_orig, h_orig = img.size
    arr = np.array(img, dtype=np.float32)
    
    # Check if pixel is background (light near-white/gray)
    # R, G, B are high and saturation is very low
    max_c = np.maximum(np.maximum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
    min_c = np.minimum(np.minimum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
    saturation = max_c - min_c
    is_light = (min_c > 210) & (saturation < 30)
    
    # Flood fill from all 4 borders to only remove external background
    bg_mask = np.zeros((h_orig, w_orig), dtype=bool)
    queue = deque()
    
    for x in range(w_orig):
        if is_light[0, x]: queue.append((0, x)); bg_mask[0, x] = True
        if is_light[h_orig-1, x]: queue.append((h_orig-1, x)); bg_mask[h_orig-1, x] = True
    for y in range(h_orig):
        if is_light[y, 0]: queue.append((y, 0)); bg_mask[y, 0] = True
        if is_light[y, w_orig-1]: queue.append((y, w_orig-1)); bg_mask[y, w_orig-1] = True
        
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h_orig and 0 <= nx < w_orig:
                if not bg_mask[ny, nx] and is_light[ny, nx]:
                    bg_mask[ny, nx] = True
                    queue.append((ny, nx))
                    
    # Flood-filled background pixels are fully transparent (alpha = 0)
    alpha = np.where(bg_mask, 0.0, 255.0)
    
    arr[:, :, 3] = alpha
    result = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    
    bbox = result.getbbox()
    if bbox:
        cropped = result.crop(bbox)
        cw, ch = cropped.size
        max_dim = max(cw, ch)
        pad_dim = int(max_dim * 1.15)
        
        square = Image.new("RGBA", (pad_dim, pad_dim), (0, 0, 0, 0))
        offset_x = (pad_dim - cw) // 2
        offset_y = (pad_dim - ch) // 2
        square.paste(cropped, (offset_x, offset_y))
        
        final_img = square.resize((512, 512), Image.Resampling.LANCZOS)
        return final_img
    return result.resize((512, 512), Image.Resampling.LANCZOS)

processed_icons = {}
for name, filename in icons.items():
    in_path = os.path.join(brain_dir, filename)
    out_path = os.path.join(out_dir, f"{name}.webp")
    final_img = remove_background(in_path)
    final_img.save(out_path, "WEBP", quality=90, method=6)
    size_kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {name}.webp: {size_kb:.1f} KB")
    processed_icons[name] = final_img

# Create contact comparison sheet
print("Creating comparison contact sheet...")
sheet_w = 1100
sheet_h = 750
sheet = Image.new("RGBA", (sheet_w, sheet_h), (255, 248, 235, 255)) # Cream background

# Draw title and sections
from PIL import ImageDraw
draw = ImageDraw.Draw(sheet)
draw.rectangle([(20, 20), (sheet_w - 20, sheet_h - 20)], fill=(255, 253, 247, 255), outline=(216, 121, 63, 100), width=2)

icon_list = list(processed_icons.items())
# Row 1: 5 icons, Row 2: 5 icons
cols = 5
start_x = 70
start_y = 70
col_gap = 200
row_gap = 280

for i, (name, icon_img) in enumerate(icon_list):
    r = i // cols
    c = i % cols
    x = start_x + c * col_gap
    y = start_y + r * row_gap
    
    # Draw ivory card tile
    draw.rounded_rectangle([(x - 8, y - 8), (x + 136, y + 136)], radius=20, fill=(255, 248, 236, 255), outline=(216, 121, 63, 60), width=1)
    
    # Paste 128x128 icon
    thumb = icon_img.resize((128, 128), Image.Resampling.LANCZOS)
    sheet.paste(thumb, (x, y), thumb)
    
    # Draw label
    clean_label = name.replace("shortcut-", "").replace("-", " ").title()
    draw.text((x + 64, y + 152), clean_label, fill=(16, 34, 45, 255), anchor="ms")

sheet_path = os.path.join(brain_dir, "shortcuts-contact-sheet.png")
sheet.save(sheet_path, "PNG")
print(f"Saved comparison contact sheet: {sheet_path}")
