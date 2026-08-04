from PIL import Image, ImageDraw, ImageFont
import os

# Paths
icon_path = "assets/android-icon-foreground-filtreai.png"
output_path = "assets/premium_splash.png"
font_path_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_path_regular = "C:/Windows/Fonts/segoeui.ttf"

# Load the icon
icon = Image.open(icon_path).convert("RGBA")

# Resize icon to something reasonable for a splash screen (e.g., 500x500)
icon = icon.resize((400, 400), Image.Resampling.LANCZOS)

# Create a transparent canvas (800x800)
canvas_width = 800
canvas_height = 800
canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))

# Paste icon
icon_x = (canvas_width - icon.width) // 2
icon_y = 100
canvas.paste(icon, (icon_x, icon_y), icon)

# Initialize drawing
draw = ImageDraw.Draw(canvas)

# Load fonts
try:
    title_font = ImageFont.truetype(font_path_bold, 80)
    slogan_font = ImageFont.truetype(font_path_regular, 40)
except IOError:
    print("Fonts not found, using default")
    title_font = ImageFont.load_default()
    slogan_font = ImageFont.load_default()

# Texts
title_text = "FiltreAI"
slogan_text = "Sadece Önemli Olanlar"

# Calculate text bounds using textbbox
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_w = title_bbox[2] - title_bbox[0]
title_h = title_bbox[3] - title_bbox[1]

slogan_bbox = draw.textbbox((0, 0), slogan_text, font=slogan_font)
slogan_w = slogan_bbox[2] - slogan_bbox[0]
slogan_h = slogan_bbox[3] - slogan_bbox[1]

# Draw Title
title_x = (canvas_width - title_w) // 2
title_y = icon_y + icon.height + 20
draw.text((title_x, title_y), title_text, font=title_font, fill=(255, 255, 255, 255))

# Draw Slogan
slogan_x = (canvas_width - slogan_w) // 2
slogan_y = title_y + title_h + 30
draw.text((slogan_x, slogan_y), slogan_text, font=slogan_font, fill=(160, 160, 160, 255))

# Save
canvas.save(output_path)
print(f"Generated {output_path} successfully!")
