import os
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from collections import deque

BRAIN_DIR = r"C:\Users\hello\.gemini\antigravity\brain\54536b9e-3c34-431e-9dbf-e3f97af63a62"
TARGET_DIR = r"d:\pak_hen\pakhen\pakhen\public\assets\dashboard\support"

os.makedirs(TARGET_DIR, exist_ok=True)

def remove_background(img_path_or_img):
    if isinstance(img_path_or_img, str):
        img = Image.open(img_path_or_img).convert("RGBA")
    else:
        img = img_path_or_img.convert("RGBA")
    w_orig, h_orig = img.size
    arr = np.array(img, dtype=np.float32)
    
    # Check if pixel is background (near white/light gray)
    is_light = (arr[:, :, 0] > 235) & (arr[:, :, 1] > 235) & (arr[:, :, 2] > 235)
    
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
                    
    # Calculate smooth alpha
    diff = np.sqrt(np.sum((255.0 - arr[:, :, :3]) ** 2, axis=2))
    alpha = np.where(bg_mask, np.clip((diff - 8.0) / (32.0 - 8.0), 0.0, 1.0) * 255.0, 255.0)
    
    arr[:, :, 3] = alpha
    result = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    
    bbox = result.getbbox()
    if bbox:
        cropped = result.crop(bbox)
        cw, ch = cropped.size
        max_dim = max(cw, ch)
        pad_dim = int(max_dim * 1.18)
        
        square = Image.new("RGBA", (pad_dim, pad_dim), (0, 0, 0, 0))
        offset_x = (pad_dim - cw) // 2
        offset_y = (pad_dim - ch) // 2
        square.paste(cropped, (offset_x, offset_y))
        
        final_img = square.resize((512, 512), Image.Resampling.LANCZOS)
        return final_img
    return result.resize((512, 512), Image.Resampling.LANCZOS)

def make_community_icon():
    # Use shortcut_referrals base with 3D figures
    ref_path = os.path.join(BRAIN_DIR, "shortcut_referrals_1789242034815.jpg")
    base_cut = remove_background(ref_path)
    
    # Create 3D Emerald Chat Bubble overlay at top right
    bubble_layer = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bubble_layer)
    
    # Draw glossy 3D emerald speech bubble
    bx0, by0, bx1, by1 = 280, 50, 460, 170
    
    # Soft drop shadow
    for r in range(12, 0, -1):
        alpha = int(35 * (1 - r/12))
        draw.rounded_rectangle([bx0-r+4, by0-r+8, bx1+r+4, by1+r+8], radius=28, fill=(6, 38, 58, alpha))
    
    # Base emerald body with highlight border
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=26, fill=(8, 122, 87, 255)) # #087A57
    draw.rounded_rectangle([bx0+3, by0+3, bx1-3, by1-3], radius=24, fill=(15, 138, 104, 255)) # #0F8A68
    
    # Bubble tail (downward pointer toward figures)
    tail_pts = [(330, by1-2), (365, by1-2), (340, by1+24)]
    draw.polygon(tail_pts, fill=(15, 138, 104, 255))
    
    # Glossy top highlight
    draw.ellipse([bx0+15, by0+6, bx1-15, by0+42], fill=(255, 255, 255, 75))
    
    # Chat indicator (three golden cream rounded dots inside)
    dot_color = (255, 248, 235, 245) # #FFF8EB
    for cx in [335, 370, 405]:
        draw.ellipse([cx-8, 100, cx+8, 116], fill=dot_color)
        draw.ellipse([cx-6, 102, cx+4, 112], fill=(255, 255, 255, 220))
        
    # Composite bubble over base figures
    combined = Image.alpha_composite(base_cut, bubble_layer)
    return combined

def process_all():
    assets = {
        "support-admin.webp": os.path.join(BRAIN_DIR, "support_admin_1789243398533.jpg"),
        "support-owner.webp": os.path.join(BRAIN_DIR, "support_owner_1789243421670.jpg"),
        "support-channel.webp": os.path.join(BRAIN_DIR, "support_channel_1789243447570.jpg"),
    }
    
    results = {}
    for filename, src_path in assets.items():
        print(f"Processing {filename} from {src_path}...")
        clean = remove_background(src_path)
        out_path = os.path.join(TARGET_DIR, filename)
        clean.save(out_path, "WEBP", quality=92, method=6)
        results[filename] = clean
        print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")
        
    print("Creating support-community.webp...")
    community_img = make_community_icon()
    comm_out = os.path.join(TARGET_DIR, "support-community.webp")
    community_img.save(comm_out, "WEBP", quality=92, method=6)
    results["support-community.webp"] = community_img
    print(f"Saved: {comm_out} ({os.path.getsize(comm_out)} bytes)")
    
    # Create contact sheet
    sheet_w, sheet_h = 960, 520
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (255, 253, 244, 255))
    draw = ImageDraw.Draw(sheet)
    
    # Outer frame
    draw.rounded_rectangle([(16, 16), (sheet_w - 16, sheet_h - 16)], radius=24, fill=(255, 255, 255, 255), outline=(216, 121, 63, 70), width=2)
    
    keys = ["support-admin.webp", "support-owner.webp", "support-channel.webp", "support-community.webp"]
    titles = ["Admin Support", "Owner Contact", "Official Channel", "Community Group"]
    descs = ["Payment and account help", "Direct assistance", "News and updates", "Join other members"]
    
    # Place in 2x2 grid
    positions = [(40, 40), (490, 40), (40, 270), (490, 270)]
    
    for i, key in enumerate(keys):
        x, y = positions[i]
        # Card background
        draw.rounded_rectangle([x, y, x+430, y+200], radius=20, fill=(255, 253, 247, 255), outline=(15, 138, 104, 80), width=2)
        # Soft pale green wash
        draw.rounded_rectangle([x+4, y+4, x+426, y+196], radius=16, fill=(37, 211, 102, 16))
        
        # Icon 130x130
        icon_thumb = results[key].resize((130, 130), Image.Resampling.LANCZOS)
        sheet.paste(icon_thumb, (x+20, y+35), icon_thumb)
        
        # Text
        draw.text((x+165, y+65), titles[i], fill=(23, 55, 47, 255))
        draw.text((x+165, y+95), descs[i], fill=(86, 109, 126, 255))
        
    contact_path = os.path.join(BRAIN_DIR, "support-contact-sheet.png")
    sheet.save(contact_path)
    print(f"Contact sheet saved to {contact_path}")

if __name__ == "__main__":
    process_all()
