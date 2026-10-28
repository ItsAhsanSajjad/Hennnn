import os
import sys
from PIL import Image
import numpy as np
from collections import deque

brain_dir = r"C:\Users\hello\.gemini\antigravity\brain\54536b9e-3c34-431e-9dbf-e3f97af63a62"
out_dir = r"D:\pak_hen\pakhen\pakhen\public\assets\dashboard\prizes"
os.makedirs(out_dir, exist_ok=True)

icons = {
    "prize-trophy": "prize_trophy_1789485462877.jpg",
    "prize-laptop": "prize_laptop_1789485496306.jpg",
    "prize-motorcycle": "prize_motorcycle_1789485531074.jpg",
    "prize-iphone": "prize_iphone_1789485572735.jpg",
    "prize-car": "prize_car_1789485614457.jpg",
}

def remove_background(img_path):
    img = Image.open(img_path).convert("RGBA")
    w_orig, h_orig = img.size
    arr = np.array(img, dtype=np.float32)
    
    max_c = np.maximum(np.maximum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
    min_c = np.minimum(np.minimum(arr[:, :, 0], arr[:, :, 1]), arr[:, :, 2])
    saturation = max_c - min_c
    is_light = (min_c > 215) & (saturation < 30)
    
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
                    
    alpha = np.where(bg_mask, 0.0, 255.0)
    arr[:, :, 3] = alpha
    result = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    
    bbox = result.getbbox()
    if bbox:
        cropped = result.crop(bbox)
        cw, ch = cropped.size
        max_dim = max(cw, ch)
        pad_dim = int(max_dim * 1.1)
        
        square = Image.new("RGBA", (pad_dim, pad_dim), (0, 0, 0, 0))
        offset_x = (pad_dim - cw) // 2
        offset_y = (pad_dim - ch) // 2
        square.paste(cropped, (offset_x, offset_y))
        
        final_img = square.resize((640, 640), Image.Resampling.LANCZOS)
        return final_img
    return result.resize((640, 640), Image.Resampling.LANCZOS)

for name, filename in icons.items():
    in_path = os.path.join(brain_dir, filename)
    out_path = os.path.join(out_dir, f"{name}.webp")
    final_img = remove_background(in_path)
    final_img.save(out_path, "WEBP", quality=92, method=6)
    size_kb = os.path.getsize(out_path) / 1024.0
    print(f"Saved {name}.webp: {size_kb:.1f} KB")

print("All prize assets processed!")
