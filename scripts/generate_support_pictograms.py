import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np

OUTPUT_DIR = r"d:\pak_hen\pakhen\pakhen\public\assets\dashboard\support"
BRAIN_DIR = r"C:\Users\hello\.gemini\antigravity\brain\54536b9e-3c34-431e-9dbf-e3f97af63a62"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# GrowMeta Color Palette
NAVY_DARK = (6, 38, 58)      # #06263A
NAVY_MID  = (16, 60, 88)
NAVY_LIGHT= (30, 95, 135)

EMERALD_DARK = (8, 122, 87)  # #087A57
EMERALD_MID  = (15, 138, 104)# #0F8A68
EMERALD_LIGHT= (37, 211, 102)# #25D366

COPPER_DARK  = (180, 85, 40)
COPPER_MID   = (237, 130, 68)# #ED8244
COPPER_LIGHT = (255, 175, 125)

GOLD_MID     = (217, 154, 43)# #D99A2B
GOLD_LIGHT   = (255, 215, 110)

CREAM_BG     = (255, 248, 235)# #FFF8EB
WHITE        = (255, 255, 255)

def create_super_canvas(scale=2):
    size = 512 * scale
    return Image.new("RGBA", (size, size), (0, 0, 0, 0)), scale

def draw_shadow(layer, bbox, radius=20, offset=(0, 15), alpha=60):
    """Draws soft contact drop shadow"""
    sh_layer = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sh_layer)
    x0, y0, x1, y1 = bbox
    ox, oy = offset
    d.rounded_rectangle([x0+ox, y0+oy, x1+ox, y1+oy], radius=radius, fill=(6, 38, 58, alpha))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius // 1.5))
    return Image.alpha_composite(sh_layer, layer)

# -------------------------------------------------------------
# 1. ADMIN PICTOGRAM: 3D Headset + Verified Shield
# -------------------------------------------------------------
def render_admin_icon():
    img, s = create_super_canvas(4) # 2048x2048 for pristine quality
    draw = ImageDraw.Draw(img)
    
    cx, cy = 256 * s, 256 * s
    
    # Base contact shadow
    sh_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    sh_draw.ellipse([cx - 160*s, cy + 130*s, cx + 160*s, cy + 190*s], fill=(6, 38, 58, 70))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(25 * s))
    img = Image.alpha_composite(sh_layer, img)
    draw = ImageDraw.Draw(img)
    
    # 1. Headband (Thick 3D arch)
    # Outer arch
    arch_bbox = [cx - 150*s, cy - 180*s, cx + 150*s, cy + 120*s]
    # Draw thick metallic arch
    for w in range(int(36*s), 0, -1):
        ratio = w / (36*s)
        col = (
            int(EMERALD_DARK[0] * (1-ratio) + EMERALD_LIGHT[0] * ratio),
            int(EMERALD_DARK[1] * (1-ratio) + EMERALD_LIGHT[1] * ratio),
            int(EMERALD_DARK[2] * (1-ratio) + EMERALD_LIGHT[2] * ratio),
            255
        )
        draw.arc([arch_bbox[0]+w, arch_bbox[1]+w, arch_bbox[2]-w, arch_bbox[3]-w], start=180, end=0, fill=col, width=int(4*s))
        
    # Top cushion on headband (Copper Accent)
    draw.arc([cx - 90*s, cy - 185*s, cx + 90*s, cy - 80*s], start=200, end=340, fill=COPPER_MID, width=int(22*s))
    draw.arc([cx - 70*s, cy - 188*s, cx + 70*s, cy - 85*s], start=210, end=330, fill=COPPER_LIGHT, width=int(8*s))

    # 2. Ear Cups (Left & Right 3D angled capsules)
    for side, sign in [("left", -1), ("right", 1)]:
        ex = cx + sign * 140*s
        ey = cy + 20*s
        
        # Outer shell (Navy / Copper hinge)
        draw.rounded_rectangle([ex - 28*s, ey - 50*s, ex + 28*s, ey + 50*s], radius=int(18*s), fill=NAVY_DARK)
        # Metallic ring
        draw.rounded_rectangle([ex - 22*s, ey - 44*s, ex + 22*s, ey + 44*s], radius=int(14*s), fill=COPPER_MID)
        draw.rounded_rectangle([ex - 18*s, ey - 40*s, ex + 18*s, ey + 40*s], radius=int(12*s), fill=COPPER_LIGHT)
        # Inner soft leather cushion
        draw.rounded_rectangle([ex - 14*s, ey - 36*s, ex + 14*s, ey + 36*s], radius=int(10*s), fill=NAVY_MID)
        
    # 3. Microphone boom (Curving from left earcup toward center)
    mic_pts = [
        (cx - 130*s, cy + 40*s),
        (cx - 90*s, cy + 110*s),
        (cx - 30*s, cy + 125*s)
    ]
    draw.line(mic_pts, fill=COPPER_MID, width=int(10*s), joint="curve")
    draw.line(mic_pts, fill=COPPER_LIGHT, width=int(4*s), joint="curve")
    # Mic capsule tip
    draw.rounded_rectangle([cx - 35*s, cy + 112*s, cx + 5*s, cy + 138*s], radius=int(8*s), fill=EMERALD_LIGHT)
    draw.rounded_rectangle([cx - 32*s, cy + 115*s, cx + 2*s, cy + 135*s], radius=int(6*s), fill=EMERALD_DARK)
    
    # 4. Center Verified 3D Shield (Emblem in center)
    sx, sy = cx + 15*s, cy + 5*s
    sw, sh = 75*s, 95*s
    
    # Shield drop shadow
    sh_pts = [
        (sx, sy - sh/2 + 10*s),
        (sx + sw, sy - sh/2 + 25*s),
        (sx + sw, sy + sh/4 + 10*s),
        (sx, sy + sh/2 + 15*s),
        (sx - sw, sy + sh/4 + 10*s),
        (sx - sw, sy - sh/2 + 25*s)
    ]
    # Shield body
    shield_pts = [
        (sx, sy - sh/2),
        (sx + sw, sy - sh/2 + 15*s),
        (sx + sw, sy + sh/4),
        (sx, sy + sh/2),
        (sx - sw, sy + sh/4),
        (sx - sw, sy - sh/2 + 15*s)
    ]
    draw.polygon(shield_pts, fill=EMERALD_DARK)
    # Inner border
    inner_pts = [
        (sx, sy - sh/2 + 8*s),
        (sx + sw - 8*s, sy - sh/2 + 20*s),
        (sx + sw - 8*s, sy + sh/4 - 4*s),
        (sx, sy + sh/2 - 10*s),
        (sx - sw + 8*s, sy + sh/4 - 4*s),
        (sx - sw + 8*s, sy - sh/2 + 20*s)
    ]
    draw.polygon(inner_pts, fill=EMERALD_LIGHT)
    # Shield core
    core_pts = [
        (sx, sy - sh/2 + 16*s),
        (sx + sw - 16*s, sy - sh/2 + 26*s),
        (sx + sw - 16*s, sy + sh/4 - 10*s),
        (sx, sy + sh/2 - 20*s),
        (sx - sw + 16*s, sy + sh/4 - 10*s),
        (sx - sw + 16*s, sy - sh/2 + 26*s)
    ]
    draw.polygon(core_pts, fill=EMERALD_MID)
    
    # Golden Checkmark inside shield
    chk_pts = [
        (sx - 24*s, sy - 2*s),
        (sx - 6*s, sy + 18*s),
        (sx + 28*s, sy - 18*s)
    ]
    draw.line(chk_pts, fill=GOLD_MID, width=int(14*s), joint="curve")
    draw.line(chk_pts, fill=GOLD_LIGHT, width=int(6*s), joint="curve")

    return img.resize((512, 512), Image.Resampling.LANCZOS)

# -------------------------------------------------------------
# 2. OWNER PICTOGRAM: 3D Minimalist User Bust + Phone Receiver
# -------------------------------------------------------------
def render_owner_icon():
    img, s = create_super_canvas(4)
    draw = ImageDraw.Draw(img)
    
    cx, cy = 256 * s, 256 * s
    
    # Base contact shadow
    sh_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    sh_draw.ellipse([cx - 150*s, cy + 130*s, cx + 150*s, cy + 190*s], fill=(6, 38, 58, 70))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(25 * s))
    img = Image.alpha_composite(sh_layer, img)
    draw = ImageDraw.Draw(img)
    
    # 1. 3D Shoulders / Bust (Navy & Emerald lapel)
    bx0, by0, bx1, by1 = cx - 140*s, cy + 40*s, cx + 140*s, cy + 180*s
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(45*s), fill=NAVY_DARK)
    # Shoulder highlight
    draw.rounded_rectangle([bx0 + 6*s, by0 + 6*s, bx1 - 6*s, by1 - 6*s], radius=int(40*s), fill=NAVY_MID)
    
    # Emerald Tie / Collar V-neck
    draw.polygon([(cx - 40*s, by0), (cx + 40*s, by0), (cx, by0 + 75*s)], fill=WHITE)
    draw.polygon([(cx - 16*s, by0 + 20*s), (cx + 16*s, by0 + 20*s), (cx, by0 + 90*s)], fill=EMERALD_MID)
    draw.polygon([(cx - 10*s, by0 + 25*s), (cx + 10*s, by0 + 25*s), (cx, by0 + 80*s)], fill=EMERALD_LIGHT)
    
    # 2. 3D Head Sphere
    hx0, hy0, hx1, hy1 = cx - 75*s, cy - 135*s, cx + 75*s, cy + 15*s
    # Shadow under chin
    draw.ellipse([hx0, hy0 + 10*s, hx1, hy1 + 10*s], fill=(6, 38, 58, 80))
    # Head base
    draw.ellipse([hx0, hy0, hx1, hy1], fill=COPPER_MID)
    # 3D spherical lighting highlight
    draw.ellipse([hx0 + 15*s, hy0 + 12*s, hx0 + 85*s, hy0 + 65*s], fill=COPPER_LIGHT)
    
    # 3. Green 3D Phone Receiver (Held on right side)
    px, py = cx + 85*s, cy - 20*s
    # Receiver bar
    draw.line([(px - 25*s, py - 60*s), (px + 25*s, py + 60*s)], fill=EMERALD_DARK, width=int(26*s))
    draw.line([(px - 25*s, py - 60*s), (px + 25*s, py + 60*s)], fill=EMERALD_LIGHT, width=int(14*s))
    
    # Earpiece cup (top)
    draw.ellipse([px - 45*s, py - 85*s, px - 5*s, py - 35*s], fill=EMERALD_MID)
    draw.ellipse([px - 40*s, py - 80*s, px - 10*s, py - 40*s], fill=EMERALD_LIGHT)
    # Mouthpiece cup (bottom)
    draw.ellipse([px + 5*s, py + 35*s, px + 45*s, py + 85*s], fill=EMERALD_MID)
    draw.ellipse([px + 10*s, py + 40*s, px + 40*s, py + 80*s], fill=EMERALD_LIGHT)
    
    # Radio / audio signal waves beside phone
    for r in [28*s, 48*s]:
        draw.arc([px + 30*s - r, py - 70*s - r, px + 30*s + r, py - 70*s + r], start=300, end=40, fill=GOLD_MID, width=int(6*s))
        draw.arc([px + 30*s - r, py - 70*s - r, px + 30*s + r, py - 70*s + r], start=300, end=40, fill=GOLD_LIGHT, width=int(3*s))

    return img.resize((512, 512), Image.Resampling.LANCZOS)

# -------------------------------------------------------------
# 3. UPDATES PICTOGRAM: 3D Megaphone + Soundwaves
# -------------------------------------------------------------
def render_updates_icon():
    img, s = create_super_canvas(4)
    draw = ImageDraw.Draw(img)
    
    cx, cy = 240 * s, 260 * s
    
    # Base contact shadow
    sh_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    sh_draw.ellipse([cx - 160*s, cy + 130*s, cx + 180*s, cy + 190*s], fill=(6, 38, 58, 70))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(25 * s))
    img = Image.alpha_composite(sh_layer, img)
    draw = ImageDraw.Draw(img)
    
    # 1. Megaphone Handle (Copper/Navy grip angled down)
    hx0, hy0 = cx - 60*s, cy + 40*s
    hx1, hy1 = cx - 30*s, cy + 155*s
    draw.line([(hx0, hy0), (hx1, hy1)], fill=NAVY_DARK, width=int(34*s))
    draw.line([(hx0, hy0), (hx1, hy1)], fill=COPPER_MID, width=int(22*s))
    draw.line([(hx0+3*s, hy0), (hx1+3*s, hy1)], fill=COPPER_LIGHT, width=int(8*s))
    
    # 2. Megaphone Main Cone (Emerald & Copper body)
    # Back cylinder (Navy / Copper base)
    bx0, by0, bx1, by1 = cx - 150*s, cy - 45*s, cx - 60*s, cy + 55*s
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(25*s), fill=NAVY_DARK)
    draw.rounded_rectangle([bx0 + 4*s, by0 + 4*s, bx1 - 4*s, by1 - 4*s], radius=int(20*s), fill=NAVY_MID)
    
    # Back button / copper dial
    draw.ellipse([bx0 - 15*s, cy - 25*s, bx0 + 15*s, cy + 35*s], fill=COPPER_MID)
    draw.ellipse([bx0 - 10*s, cy - 20*s, bx0 + 10*s, cy + 30*s], fill=COPPER_LIGHT)
    
    # Flaring Cone (Emerald body)
    cone_pts = [
        (cx - 70*s, cy - 40*s),
        (cx + 80*s, cy - 110*s),
        (cx + 80*s, cy + 120*s),
        (cx - 70*s, cy + 50*s)
    ]
    draw.polygon(cone_pts, fill=EMERALD_DARK)
    
    # Cone 3D volumetric highlight
    hl_pts = [
        (cx - 70*s, cy - 40*s),
        (cx + 80*s, cy - 110*s),
        (cx + 80*s, cy - 20*s),
        (cx - 70*s, cy + 5*s)
    ]
    draw.polygon(hl_pts, fill=EMERALD_MID)
    
    # Thin top specular line
    draw.line([(cx - 65*s, cy - 35*s), (cx + 75*s, cy - 100*s)], fill=EMERALD_LIGHT, width=int(8*s))

    # Top handle arch on megaphone
    draw.arc([cx - 80*s, cy - 85*s, cx + 20*s, cy - 15*s], start=180, end=0, fill=COPPER_MID, width=int(14*s))
    draw.arc([cx - 75*s, cy - 88*s, cx + 15*s, cy - 20*s], start=190, end=350, fill=COPPER_LIGHT, width=int(5*s))

    # 3. Flared Horn Rim (Cream Ivory thick 3D ring)
    rx, ry = cx + 80*s, cy + 5*s
    rw, rh = 35*s, 125*s
    draw.ellipse([rx - rw, ry - rh, rx + rw, ry + rh], fill=CREAM_BG)
    draw.ellipse([rx - rw + 6*s, ry - rh + 8*s, rx + rw - 6*s, ry + rh - 8*s], fill=WHITE)
    # Inner dark mouth
    draw.ellipse([rx - rw + 14*s, ry - rh + 20*s, rx + rw - 14*s, ry + rh - 20*s], fill=NAVY_DARK)
    
    # 4. Two Golden Broadcast Soundwaves
    for r, w in [(65*s, 14*s), (115*s, 16*s)]:
        wx = rx + 30*s
        draw.arc([wx - r, ry - r*1.2, wx + r, ry + r*1.2], start=305, end=55, fill=GOLD_MID, width=int(w))
        draw.arc([wx - r, ry - r*1.2, wx + r, ry + r*1.2], start=315, end=45, fill=GOLD_LIGHT, width=int(w/2))

    return img.resize((512, 512), Image.Resampling.LANCZOS)

# -------------------------------------------------------------
# 4. COMMUNITY PICTOGRAM: 3 Rounded Silhouettes + 3D Chat Bubble
# -------------------------------------------------------------
def render_community_icon():
    img, s = create_super_canvas(4)
    draw = ImageDraw.Draw(img)
    
    cx, cy = 256 * s, 275 * s
    
    # Base contact shadow
    sh_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sh_layer)
    sh_draw.ellipse([cx - 170*s, cy + 105*s, cx + 170*s, cy + 175*s], fill=(6, 38, 58, 70))
    sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(25 * s))
    img = Image.alpha_composite(sh_layer, img)
    draw = ImageDraw.Draw(img)
    
    # 1. Left Figure (Emerald Silhouette)
    lx, ly = cx - 100*s, cy + 55*s
    # Shoulder
    draw.rounded_rectangle([lx - 55*s, ly, lx + 55*s, ly + 95*s], radius=int(25*s), fill=EMERALD_DARK)
    draw.rounded_rectangle([lx - 50*s, ly + 4*s, lx + 50*s, ly + 90*s], radius=int(22*s), fill=EMERALD_MID)
    # Head
    draw.ellipse([lx - 34*s, ly - 65*s, lx + 34*s, ly - 3*s], fill=EMERALD_MID)
    draw.ellipse([lx - 24*s, ly - 58*s, lx + 12*s, ly - 22*s], fill=EMERALD_LIGHT)
    
    # 2. Right Figure (Navy Silhouette)
    rx, ry = cx + 100*s, cy + 55*s
    # Shoulder
    draw.rounded_rectangle([rx - 55*s, ry, rx + 55*s, ry + 95*s], radius=int(25*s), fill=NAVY_DARK)
    draw.rounded_rectangle([rx - 50*s, ry + 4*s, rx + 50*s, ry + 90*s], radius=int(22*s), fill=NAVY_MID)
    # Head
    draw.ellipse([rx - 34*s, ry - 65*s, rx + 34*s, ry - 3*s], fill=NAVY_MID)
    draw.ellipse([rx - 24*s, ry - 58*s, rx + 12*s, ry - 22*s], fill=NAVY_LIGHT)

    # 3. Center Figure (Copper / Leader Silhouette in front)
    mx, my = cx, cy + 30*s
    # Shoulder
    draw.rounded_rectangle([mx - 65*s, my, mx + 65*s, my + 120*s], radius=int(30*s), fill=COPPER_DARK)
    draw.rounded_rectangle([mx - 60*s, my + 5*s, mx + 60*s, my + 115*s], radius=int(26*s), fill=COPPER_MID)
    draw.rounded_rectangle([mx - 52*s, my + 8*s, mx + 20*s, my + 50*s], radius=int(18*s), fill=COPPER_LIGHT)
    # Head
    draw.ellipse([mx - 40*s, my - 80*s, mx + 40*s, my - 5*s], fill=COPPER_MID)
    draw.ellipse([mx - 30*s, my - 72*s, mx + 15*s, my - 28*s], fill=COPPER_LIGHT)

    # 4. Floating 3D Emerald Chat Bubble (Above Center)
    bx0, by0, bx1, by1 = cx - 110*s, cy - 225*s, cx + 110*s, cy - 115*s
    
    # Chat bubble shadow
    for r in range(int(16*s), 0, -1):
        alpha = int(35 * (1 - r/(16*s)))
        draw.rounded_rectangle([bx0-r, by0-r+10*s, bx1+r, by1+r+10*s], radius=int(28*s), fill=(6, 38, 58, alpha))
        
    # Chat bubble body
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=int(26*s), fill=EMERALD_DARK)
    draw.rounded_rectangle([bx0 + 4*s, by0 + 4*s, bx1 - 4*s, by1 - 4*s], radius=int(22*s), fill=EMERALD_MID)
    
    # Bubble tail (downward pointer)
    tail_pts = [(cx - 20*s, by1 - 2*s), (cx + 20*s, by1 - 2*s), (cx, by1 + 22*s)]
    draw.polygon(tail_pts, fill=EMERALD_MID)
    
    # Glossy top highlight
    draw.ellipse([bx0 + 20*s, by0 + 8*s, bx1 - 20*s, by0 + 45*s], fill=(255, 255, 255, 90))
    
    # Three golden cream dots inside
    for dx in [-45*s, 0, 45*s]:
        draw.ellipse([cx + dx - 12*s, cy - 180*s, cx + dx + 12*s, cy - 156*s], fill=CREAM_BG)
        draw.ellipse([cx + dx - 9*s, cy - 177*s, cx + dx + 5*s, cy - 163*s], fill=WHITE)

    return img.resize((512, 512), Image.Resampling.LANCZOS)

def generate_all():
    print("Rendering 4 simplified 3D pictograms...")
    
    admin_img = render_admin_icon()
    admin_out = os.path.join(OUTPUT_DIR, "support-admin.webp")
    admin_img.save(admin_out, "WEBP", quality=95, method=6)
    print(f"Saved: {admin_out} ({os.path.getsize(admin_out)} bytes)")
    
    owner_img = render_owner_icon()
    owner_out = os.path.join(OUTPUT_DIR, "support-owner.webp")
    owner_img.save(owner_out, "WEBP", quality=95, method=6)
    print(f"Saved: {owner_out} ({os.path.getsize(owner_out)} bytes)")
    
    updates_img = render_updates_icon()
    updates_out = os.path.join(OUTPUT_DIR, "support-updates.webp")
    updates_img.save(updates_out, "WEBP", quality=95, method=6)
    print(f"Saved: {updates_out} ({os.path.getsize(updates_out)} bytes)")
    
    # Also save support-channel.webp alias if referenced
    channel_out = os.path.join(OUTPUT_DIR, "support-channel.webp")
    updates_img.save(channel_out, "WEBP", quality=95, method=6)
    
    comm_img = render_community_icon()
    comm_out = os.path.join(OUTPUT_DIR, "support-community.webp")
    comm_img.save(comm_out, "WEBP", quality=95, method=6)
    print(f"Saved: {comm_out} ({os.path.getsize(comm_out)} bytes)")
    
    # Create small-size test contact sheet (testing at 32px, 36px, 44px, 64px, 128px)
    sheet = Image.new("RGBA", (1000, 600), (255, 253, 244, 255))
    draw = ImageDraw.Draw(sheet)
    
    # Draw contact sheet
    items = [
        ("Admin", admin_img),
        ("Owner", owner_img),
        ("Updates", updates_img),
        ("Community", comm_img)
    ]
    
    # Draw title
    draw.text((40, 25), "WhatsApp Support 3D Simplified Pictograms - Display Size Test", fill=(6, 38, 58, 255))
    
    for i, (name, icon) in enumerate(items):
        y = 70 + i * 125
        draw.text((40, y + 45), name, fill=(6, 38, 58, 255))
        
        # Test 128px
        t128 = icon.resize((100, 100), Image.Resampling.LANCZOS)
        sheet.paste(t128, (160, y), t128)
        
        # Test 64px
        t64 = icon.resize((64, 64), Image.Resampling.LANCZOS)
        sheet.paste(t64, (300, y + 18), t64)
        
        # Test 44px
        t44 = icon.resize((44, 44), Image.Resampling.LANCZOS)
        sheet.paste(t44, (400, y + 28), t44)
        
        # Test 36px (target mobile size)
        t36 = icon.resize((36, 36), Image.Resampling.LANCZOS)
        sheet.paste(t36, (480, y + 32), t36)
        
        # Test 32px
        t32 = icon.resize((32, 32), Image.Resampling.LANCZOS)
        sheet.paste(t32, (550, y + 34), t32)
        
        # Simulate Card Container at real size (150x58)
        card_x, card_y = 630, y + 15
        draw.rounded_rectangle([card_x, card_y, card_x + 190, card_y + 64], radius=12, fill=(246, 252, 248, 255), outline=(15, 138, 104, 60), width=1)
        card_t42 = icon.resize((40, 40), Image.Resampling.LANCZOS)
        sheet.paste(card_t42, (card_x + 8, card_y + 12), card_t42)
        
        # Draw labels
        subtext = {
            "Admin": "Help desk",
            "Owner": "Direct help",
            "Updates": "Official news",
            "Community": "Member group"
        }[name]
        draw.text((card_x + 56, card_y + 16), name, fill=(10, 51, 35, 255))
        draw.text((card_x + 56, card_y + 36), subtext, fill=(72, 107, 94, 255))
        
    sheet_path = os.path.join(BRAIN_DIR, "support-pictograms-test.png")
    sheet.save(sheet_path)
    print(f"Saved test sheet: {sheet_path}")

if __name__ == "__main__":
    generate_all()
