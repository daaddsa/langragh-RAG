import io
import os
from datetime import datetime
from typing import List

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Try to register a Chinese font. 
# We use SimSun (simsun.ttc) which is standard on Windows.
# Note: It's a TTC file, so we need to specify subfontIndex=0.
# Path correction: backend/app/../assets/simsun.ttc
FONT_PATH_SIMSUN = os.path.join(os.path.dirname(__file__), "../assets/simsun.ttc")
FONT_NAME = "ChineseFont"

# Global flag to track font registration
_font_registered = False

def register_font():
    global _font_registered
    if _font_registered:
        return True
        
    try:
        # Check if simsun.ttc exists
        if os.path.exists(FONT_PATH_SIMSUN):
            # Register TTC font (subfontIndex=0 usually is SimSun)
            pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH_SIMSUN, subfontIndex=0))
            print(f"DEBUG: Successfully registered font {FONT_NAME} from {FONT_PATH_SIMSUN}")
            _font_registered = True
            return True
        else:
            print(f"DEBUG: Font file not found at {FONT_PATH_SIMSUN}")
            return False
    except Exception as e:
        print(f"DEBUG: Failed to register font: {e}")
        return False

def generate_pdf(messages: List[dict], title: str = "研报") -> bytes:
    """
    Generates a PDF from a list of messages.
    
    Args:
        messages: List of dicts with 'role' and 'content'.
        title: Title of the report.
        
    Returns:
        Bytes of the PDF file.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    has_font = register_font()
    font_name = FONT_NAME if has_font else "Helvetica"
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName=font_name,
        fontSize=18,
        spaceAfter=20,
        alignment=1 # Center
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=10,
        leading=14,
        spaceAfter=10
    )
    
    bold_style = ParagraphStyle(
        'BoldStyle',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=11,
        leading=14,
        spaceAfter=6,
        textColor=colors.darkblue
    )
    
    # 1. Title Page
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}", normal_style))
    story.append(Spacer(1, 20))
    
    # 2. Content
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        
        # Simple Markdown cleanup for ReportLab (ReportLab supports limited XML tags)
        # For MVP, we just strip basic markdown chars or treat as plain text
        # In production, use markdown2pdf parsers.
        content = content.replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
        
        if role == "user":
            story.append(Paragraph(f"Q: {content}", bold_style))
        elif role == "assistant":
            story.append(Paragraph(f"A: {content}", normal_style))
            story.append(Spacer(1, 10))
        elif role == "tool":
            # Optional: Show tool outputs or sources?
            # For this MVP, maybe we skip raw tool outputs in the main flow
            pass
            
    # 3. Build
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
